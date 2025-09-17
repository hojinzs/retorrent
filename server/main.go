package main

import (
	"context"
	"fmt"
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
	_ "backend/migrations"
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

		// Add API routes for torrent operations
		se.Router.GET("/api/torrents", func(re *core.RequestEvent) error {
			// This will be handled by PocketBase's built-in REST API for the torrents collection
			// But we could add custom logic here if needed
			return re.Next()
		})

		// Custom API endpoint to force sync
		se.Router.POST("/api/torrents/sync", func(re *core.RequestEvent) error {
			if syncService == nil {
				return re.JSON(503, map[string]string{"error": "Transmission client not available"})
			}

			if err := syncService.ForceSync(); err != nil {
				return re.JSON(500, map[string]string{"error": err.Error()})
			}

			return re.JSON(200, map[string]string{"message": "Sync completed"})
		})

		// API endpoint to add torrents
		se.Router.POST("/api/torrents/add", func(re *core.RequestEvent) error {
			if transmissionClient == nil {
				return re.JSON(503, map[string]string{"error": "Transmission client not available"})
			}

			// Parse request body
			var request struct {
				Torrent     string  `json:"torrent"`
				DownloadDir *string `json:"downloadDir,omitempty"`
				AutoStart   *bool   `json:"autoStart,omitempty"`
			}

			if err := re.BindBody(&request); err != nil {
				return re.JSON(400, map[string]string{"error": "Invalid request body"})
			}

			if request.Torrent == "" {
				return re.JSON(400, map[string]string{"error": "Torrent data is required"})
			}

			// Add torrent
			ctx := re.Request.Context()
			torrentData, err := transmissionClient.AddTorrent(ctx, request.Torrent, request.DownloadDir)
			if err != nil {
				return re.JSON(400, map[string]string{"error": err.Error()})
			}

			// Auto start if requested
			if request.AutoStart != nil && *request.AutoStart && torrentData != nil {
				if err := transmissionClient.StartTorrents(ctx, []int64{torrentData.ID}); err != nil {
					log.Printf("Failed to auto-start torrent %d: %v", torrentData.ID, err)
					// Don't fail the request, just log the error
				}
			}

			// Force sync to update the database
			if err := syncService.ForceSync(); err != nil {
				log.Printf("Failed to sync after adding torrent: %v", err)
			}

			return re.JSON(200, map[string]interface{}{
				"success":         true,
				"transmission_id": torrentData.ID,
				"message":         "Torrent added successfully",
			})
		})

		// API endpoint to remove torrents
		se.Router.POST("/api/torrents/remove", func(re *core.RequestEvent) error {
			if transmissionClient == nil {
				return re.JSON(503, map[string]string{"error": "Transmission client not available"})
			}

			// Parse request body
			var request struct {
				IDs             []int64 `json:"ids"`
				DeleteLocalData *bool   `json:"deleteLocalData,omitempty"`
			}

			if err := re.BindBody(&request); err != nil {
				return re.JSON(400, map[string]string{"error": "Invalid request body"})
			}

			if len(request.IDs) == 0 {
				return re.JSON(400, map[string]string{"error": "At least one torrent ID is required"})
			}

			// Default to false if not specified
			deleteLocalData := false
			if request.DeleteLocalData != nil {
				deleteLocalData = *request.DeleteLocalData
			}

			// Remove torrents
			ctx := re.Request.Context()
			log.Printf("Removing torrents with IDs: %v, deleteLocalData: %v", request.IDs, deleteLocalData)
			if err := transmissionClient.RemoveTorrents(ctx, request.IDs, deleteLocalData); err != nil {
				return re.JSON(400, map[string]string{"error": err.Error()})
			}
			// Force sync to update the database
			if err := syncService.ForceSync(); err != nil {
				log.Printf("Failed to sync after removing torrents: %v", err)
			}

			return re.JSON(200, map[string]interface{}{
				"success": true,
				"message": fmt.Sprintf("Successfully removed %d torrent(s)", len(request.IDs)),
			})
		})

		// API endpoint for torrent actions (backward compatibility)
		// Supports both POST (JSON body) and GET (query params) for convenience
		se.Router.POST("/api/torrents/{id}/action", func(re *core.RequestEvent) error {
			if transmissionClient == nil {
				return re.JSON(503, map[string]string{"error": "Transmission client not available"})
			}

			// Parse torrent ID from URL
			torrentID := re.Request.PathValue("id")

			if torrentID == "" {
				return re.JSON(400, map[string]string{"error": "Torrent ID is required"})
			}

			log.Printf("torrentID %v", torrentID)

			// Resolve to Transmission ID (accepts numeric Transmission ID or PocketBase record id)
			var id int64
			if _, err := fmt.Sscanf(torrentID, "%d", &id); err != nil {
				// Not a number; try treating as PocketBase record id
				collection, cerr := app.FindCollectionByNameOrId("torrents")
				if cerr != nil {
					return re.JSON(400, map[string]string{"error": "Invalid torrent ID"})
				}
				rec, rerr := app.FindRecordById(collection, torrentID, nil)
				if rerr != nil {
					return re.JSON(404, map[string]string{"error": "Torrent not found"})
				}
				// transmissionId is stored as number in the record
				id = int64(rec.GetInt("transmissionId"))
				if id == 0 {
					return re.JSON(400, map[string]string{"error": "Record missing transmissionId"})
				}
			}

			// Parse request body
			var request struct {
				Action string                 `json:"action"`
				Params map[string]interface{} `json:"params,omitempty"`
			}

			if err := re.BindBody(&request); err != nil {
				return re.JSON(400, map[string]string{"error": "Invalid request body"})
			}

			ctx := re.Request.Context()
			switch request.Action {
			case "start":
				if err := transmissionClient.StartTorrents(ctx, []int64{id}); err != nil {
					return re.JSON(400, map[string]string{"error": err.Error()})
				}
			case "stop":
				if err := transmissionClient.StopTorrents(ctx, []int64{id}); err != nil {
					return re.JSON(400, map[string]string{"error": err.Error()})
				}
			case "remove":
				// Check for deleteLocalData parameter
				deleteLocalData := false
				if request.Params != nil {
					if val, ok := request.Params["deleteLocalData"].(bool); ok {
						deleteLocalData = val
					}
				}
				if err := transmissionClient.RemoveTorrents(ctx, []int64{id}, deleteLocalData); err != nil {
					return re.JSON(400, map[string]string{"error": err.Error()})
				}
			default:
				return re.JSON(400, map[string]string{"error": "Invalid action"})
			}

			// Force sync to update the database
			if err := syncService.ForceSync(); err != nil {
				log.Printf("Failed to sync after %s action: %v", request.Action, err)
			}

			return re.JSON(200, map[string]interface{}{
				"success": true,
				"message": fmt.Sprintf("Torrent %s successful", request.Action),
			})
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
