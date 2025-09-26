package routes

import (
	"encoding/base64"
	"fmt"
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
	// Parse request body
	var request torrent.AddTorrentRequest

	if err := re.BindBody(&request); err != nil {
		return re.JSON(400, map[string]string{"error": "Invalid request body"})
	}

	// Debug logging to understand what data we're receiving
	fmt.Printf("DEBUG: Received torrent request - Data length: %d\n", len(request.Torrent))
	if len(request.Torrent) > 0 {
		if len(request.Torrent) < 200 {
			fmt.Printf("DEBUG: Full torrent data: %q\n", request.Torrent)
		} else {
			fmt.Printf("DEBUG: First 100 chars: %q\n", request.Torrent[:100])
			fmt.Printf("DEBUG: Last 100 chars: %q\n", request.Torrent[len(request.Torrent)-100:])
		}
		
		// Check if it's a magnet link or supposed to be base64
		if strings.HasPrefix(request.Torrent, "magnet:") {
			fmt.Printf("DEBUG: Detected magnet link\n")
		} else {
			fmt.Printf("DEBUG: Treating as torrent file (base64)\n")
			// For base64, let's see what the first few characters decode to
			if len(request.Torrent) >= 8 {
				decoded, err := base64.StdEncoding.DecodeString(request.Torrent[:8])
				if err != nil {
					fmt.Printf("DEBUG: First 8 chars not valid base64: %v\n", err)
				} else {
					fmt.Printf("DEBUG: First 8 chars decode to: %x\n", decoded)
				}
			}
		}
	}

	// Add torrent using service
	ctx := re.Request.Context()
	torrentData, err := tr.service.AddTorrent(ctx, request)
	if err != nil {
		fmt.Printf("DEBUG: Service error: %v\n", err)
		return re.JSON(400, map[string]string{"error": err.Error()})
	}

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