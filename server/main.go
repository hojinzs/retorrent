package main

import (
	"context"
	"log"
	"os"
	"path"
	"strings"
	"time"

    "github.com/joho/godotenv"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"

	"backend/internal/transmission"
	"backend/internal/torrent"
	_ "backend/migrations"
	"backend/routes"
	"backend/users"
)

func isAssetPath(p string) bool {
	if strings.HasPrefix(p, "/api/") {
		return false
	}
	// 확장자가 있으면 정적 파일로 간주 (예: .css, .js, .png, .svg, .ico 등)
	return strings.Contains(path.Base(p), ".")
}

func main() {
    if err := godotenv.Load(); err != nil {
        log.Println("No .env file found")
    }

	app := pocketbase.New()

	// Global variables for transmission client and sync service
	var transmissionClient transmission.TransmissionClient
	var syncService *transmission.SyncService

	// Initialize Transmission client and sync service after server starts
	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		// Initialize Transmission client
		transmissionHost := os.Getenv("TRANSMISSION_HOST")
		if transmissionHost == "" {
			transmissionHost = "http://localhost:9091/transmission/rpc"
		}

		transmissionUser := os.Getenv("TRANSMISSION_USER")
		transmissionPass := os.Getenv("TRANSMISSION_PASS")

		// Try to connect to real Transmission first
		client, err := transmission.NewClient(app, transmissionHost, transmissionUser, transmissionPass)
		if err == nil {
			// Test the connection by trying to get torrents
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			_, testErr := client.GetTorrents(ctx)
			cancel()

			if testErr != nil {
				log.Printf("Warning: Failed to connect to Transmission: %v", testErr)
				log.Println("Falling back to demo mode with mock data...")

				// Use mock client for demo
				mockClient := transmission.NewMockClient(app)
				transmissionClient = mockClient
				log.Println("Mock Transmission client initialized for demo")
			} else {
				transmissionClient = client
				log.Println("Transmission client initialized successfully")
			}
		} else {
			log.Printf("Warning: Failed to initialize Transmission client: %v", err)
			log.Println("Falling back to demo mode with mock data...")

			// Use mock client for demo
			mockClient := transmission.NewMockClient(app)
			transmissionClient = mockClient
			log.Println("Mock Transmission client initialized for demo")
		}

		// Initialize sync service with either real or mock client
		syncInterval := 5 * time.Second // Sync every 5 seconds for real-time feel
		syncService = transmission.NewSyncService(app, transmissionClient, syncInterval)

		// Start sync service
		if err := syncService.Start(); err != nil {
			log.Printf("Failed to start sync service: %v", err)
		} else {
			log.Println("Transmission sync service started")
		}

		// Initialize torrent service with transmission client and sync service
		torrentService := torrent.NewService(app, transmissionClient, syncService)

		// Initialize and register torrent routes
		torrentRoutes := routes.NewTorrentRoutes(torrentService)
		torrentRoutes.RegisterRoutes(se)

		// Add API routes for torrent operations
		se.Router.GET("/api/torrents", func(re *core.RequestEvent) error {
			// This will be handled by PocketBase's built-in REST API for the torrents collection
			// But we could add custom logic here if needed
			return re.Next()
		})

		// Register user-related routes
		users.RegisterRoutes(app, se)

		// serves static files from the provided public dir (if exists)
		// Note: avoid intercepting API routes with the catch-all static handler
		se.Router.GET("/{path...}", func(re *core.RequestEvent) error {
			p := re.Request.URL.Path

			// 1) /api/* 는 다음 핸들러로
			if strings.HasPrefix(p, "/api/") {
				return re.Next()
			}

			// 2) 정적 파일/SPA 구분
			fs := os.DirFS("./pb_public")

			// 확장자가 있으면 정적 파일로 간주 (예: .css, .js, .png 등)
			if strings.Contains(path.Base(p), ".") {
				// 파일이 없을 때 index.html 폴백 없이 404를 내고 싶다면 아래처럼 NotFound로 종료 가능
				// 단, Static 핸들러가 자체적으로 404를 처리하므로 보통은 한 줄이면 충분합니다.
				return apis.Static(fs, false)(re)
			}

			// 3) SPA 라우트는 index.html 폴백
			return apis.Static(fs, true)(re)
		})

		return se.Next()
	})

	// Cleanup on shutdown
	app.OnTerminate().BindFunc(func(te *core.TerminateEvent) error {
		if syncService != nil {
			syncService.Stop()
		}
		return te.Next()
	})

	// loosely check if it was executed using "go run"
	isGoRun := strings.HasPrefix(os.Args[0], os.TempDir())

	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		// enable auto creation of migration files when making collection changes in the Dashboard
		// (the isGoRun check is to enable it only during development)
		Automigrate: isGoRun,
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
