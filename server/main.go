package main

import (
    "context"
    "log"
    "os"
    "strings"
    "time"

    "github.com/pocketbase/pocketbase"
    "github.com/pocketbase/pocketbase/apis"
    "github.com/pocketbase/pocketbase/core"
    "github.com/pocketbase/pocketbase/plugins/migratecmd"

    _ "backend/migrations"
    "backend/internal/transmission"
)

func main() {
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
//                 log.Printf("Warning: Failed to connect to Transmission: %v", testErr)
//                 log.Println("Falling back to demo mode with mock data...")

                // Use mock client for demo
                mockClient := transmission.NewMockClient(app)
                transmissionClient = mockClient
//                 log.Println("Mock Transmission client initialized for demo")
            } else {
                transmissionClient = client
//                 log.Println("Transmission client initialized successfully")
            }
        } else {
//             log.Printf("Warning: Failed to initialize Transmission client: %v", err)
//             log.Println("Falling back to demo mode with mock data...")

            // Use mock client for demo
            mockClient := transmission.NewMockClient(app)
            transmissionClient = mockClient
//             log.Println("Mock Transmission client initialized for demo")
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

        // serves static files from the provided public dir (if exists)
        se.Router.GET("/{path...}", apis.Static(os.DirFS("./pb_public"), false))

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