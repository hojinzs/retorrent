package routes

import (
	"fmt"
	"log"
	"strings"

	"github.com/pocketbase/pocketbase/core"

	"backend/internal/torrent"
)

// TorrentRoutes handles torrent-related HTTP routes
type TorrentRoutes struct {
	service *torrent.Service
}

// NewTorrentRoutes creates a new torrent routes handler
func NewTorrentRoutes(service *torrent.Service) *TorrentRoutes {
	return &TorrentRoutes{
		service: service,
	}
}

// RegisterRoutes registers torrent-related routes
func (tr *TorrentRoutes) RegisterRoutes(se *core.ServeEvent) {
	// Custom API endpoint to force sync
	se.Router.POST("/api/torrents/sync", tr.handleSync)

	// API endpoint to add torrents
	se.Router.POST("/api/torrents/add", tr.handleAddTorrent)

	// API endpoint to remove torrents
	se.Router.POST("/api/torrents/remove", tr.handleRemoveTorrents)

	// API endpoint for torrent actions (backward compatibility)
	se.Router.POST("/api/torrents/{id}/action", tr.handleTorrentAction)
}

// handleSync handles sync requests
func (tr *TorrentRoutes) handleSync(re *core.RequestEvent) error {
	if err := tr.service.ForceSync(); err != nil {
		return re.JSON(500, map[string]string{"error": err.Error()})
	}

	return re.JSON(200, map[string]string{"message": "Sync completed"})
}

// handleAddTorrent handles add torrent requests
func (tr *TorrentRoutes) handleAddTorrent(re *core.RequestEvent) error {
	log.Printf("handleAddTorrent: Received request from %s", re.Request.RemoteAddr)
	
	// Log request headers for debugging
	contentType := re.Request.Header.Get("Content-Type")
	log.Printf("handleAddTorrent: Content-Type: %s", contentType)
	
	// Parse request body
	var request torrent.AddTorrentRequest

	if err := re.BindBody(&request); err != nil {
		log.Printf("handleAddTorrent: ERROR - Failed to bind request body: %v", err)
		return re.JSON(400, map[string]string{"error": "Invalid request body: " + err.Error()})
	}
	
	// Validate request data
	if request.Torrent == "" {
		log.Printf("handleAddTorrent: ERROR - Empty torrent data")
		return re.JSON(400, map[string]string{"error": "Torrent data is required"})
	}
	
	log.Printf("handleAddTorrent: Request parsed - torrent data length: %d, downloadDir: %v, autoStart: %v", 
		len(request.Torrent), request.DownloadDir, request.AutoStart)
	
	// Log the type of torrent (magnet vs file)
	if strings.HasPrefix(request.Torrent, "magnet:") {
		log.Printf("handleAddTorrent: Processing magnet link")
	} else {
		log.Printf("handleAddTorrent: Processing torrent file (base64)")
		log.Printf("handleAddTorrent: Raw torrent data length: %d", len(request.Torrent))
		
		// Log detailed information about the data
		if len(request.Torrent) > 0 {
			// Show first few characters as hex for debugging
			sample := request.Torrent
			if len(sample) > 50 {
				sample = sample[:50]
			}
			log.Printf("handleAddTorrent: First 50 chars: %q", sample)
			log.Printf("handleAddTorrent: First 10 bytes as hex: %x", []byte(sample)[:minInt(10, len(sample))])
		}
		
		// Check if it's completely empty or just whitespace
		trimmed := strings.TrimSpace(request.Torrent)
		if len(trimmed) == 0 {
			log.Printf("handleAddTorrent: ERROR - Data is empty or only whitespace")
			return re.JSON(400, map[string]string{"error": "Torrent data is empty"})
		}
		
		// For now, let's try to continue with the original data to see what the transmission client reports
		log.Printf("handleAddTorrent: Proceeding with torrent data (length: %d)", len(request.Torrent))
		// Don't modify the torrent data - pass it through as-is for debugging
	}

	// Add torrent using service
	ctx := re.Request.Context()
	log.Printf("handleAddTorrent: Calling service.AddTorrent")
	torrentData, err := tr.service.AddTorrent(ctx, request)
	if err != nil {
		log.Printf("handleAddTorrent: ERROR from service.AddTorrent: %v", err)
		return re.JSON(400, map[string]string{"error": err.Error()})
	}

	log.Printf("handleAddTorrent: SUCCESS - torrent added with ID: %d, Name: %s", torrentData.ID, torrentData.Name)
	return re.JSON(200, map[string]interface{}{
		"success":         true,
		"transmission_id": torrentData.ID,
		"message":         "Torrent added successfully",
	})
}

// handleRemoveTorrents handles remove torrents requests
func (tr *TorrentRoutes) handleRemoveTorrents(re *core.RequestEvent) error {
	// Parse request body
	var request torrent.RemoveTorrentRequest

	if err := re.BindBody(&request); err != nil {
		return re.JSON(400, map[string]string{"error": "Invalid request body"})
	}

	// Remove torrents using service
	ctx := re.Request.Context()
	if err := tr.service.RemoveTorrents(ctx, request); err != nil {
		return re.JSON(400, map[string]string{"error": err.Error()})
	}

	return re.JSON(200, map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("Successfully removed %d torrent(s)", len(request.IDs)),
	})
}

// handleTorrentAction handles torrent action requests
func (tr *TorrentRoutes) handleTorrentAction(re *core.RequestEvent) error {
	// Parse torrent ID from URL
	torrentID := re.Request.PathValue("id")

	// Parse request body
	var request torrent.ActionRequest

	if err := re.BindBody(&request); err != nil {
		return re.JSON(400, map[string]string{"error": "Invalid request body"})
	}

	// Perform action using service
	ctx := re.Request.Context()
	if err := tr.service.PerformAction(ctx, torrentID, request); err != nil {
		return re.JSON(400, map[string]string{"error": err.Error()})
	}

	return re.JSON(200, map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("Torrent %s successful", request.Action),
	})
}

// minInt returns the minimum of two integers
func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}