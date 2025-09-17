package torrent

import (
	"context"
	"fmt"
	"log"

	"github.com/pocketbase/pocketbase"

	"backend/internal/transmission"
)

// Service provides torrent management operations
type Service struct {
	app                *pocketbase.PocketBase
	transmissionClient transmission.TransmissionClient
	syncService        *transmission.SyncService
}

// NewService creates a new torrent service instance
func NewService(app *pocketbase.PocketBase, transmissionClient transmission.TransmissionClient, syncService *transmission.SyncService) *Service {
	return &Service{
		app:                app,
		transmissionClient: transmissionClient,
		syncService:        syncService,
	}
}

// AddTorrentRequest represents the request to add a torrent
type AddTorrentRequest struct {
	Torrent     string  `json:"torrent"`
	DownloadDir *string `json:"downloadDir,omitempty"`
	AutoStart   *bool   `json:"autoStart,omitempty"`
}

// RemoveTorrentRequest represents the request to remove torrents
type RemoveTorrentRequest struct {
	IDs             []int64 `json:"ids"`
	DeleteLocalData *bool   `json:"deleteLocalData,omitempty"`
}

// ActionRequest represents the request for torrent actions
type ActionRequest struct {
	Action string                 `json:"action"`
	Params map[string]interface{} `json:"params,omitempty"`
}

// AddTorrent adds a new torrent
func (s *Service) AddTorrent(ctx context.Context, req AddTorrentRequest) (*transmission.TorrentData, error) {
	if s.transmissionClient == nil {
		return nil, fmt.Errorf("transmission client not available")
	}

	if req.Torrent == "" {
		return nil, fmt.Errorf("torrent data is required")
	}

	// Add torrent
	torrentData, err := s.transmissionClient.AddTorrent(ctx, req.Torrent, req.DownloadDir)
	if err != nil {
		return nil, fmt.Errorf("failed to add torrent: %w", err)
	}

	// Auto start if requested
	if req.AutoStart != nil && *req.AutoStart && torrentData != nil {
		if err := s.transmissionClient.StartTorrents(ctx, []int64{torrentData.ID}); err != nil {
			log.Printf("Failed to auto-start torrent %d: %v", torrentData.ID, err)
			// Don't fail the request, just log the error
		}
	}

	// Force sync to update the database
	if err := s.syncService.ForceSync(); err != nil {
		log.Printf("Failed to sync after adding torrent: %v", err)
	}

	return torrentData, nil
}

// RemoveTorrents removes torrents
func (s *Service) RemoveTorrents(ctx context.Context, req RemoveTorrentRequest) error {
	if s.transmissionClient == nil {
		return fmt.Errorf("transmission client not available")
	}

	if len(req.IDs) == 0 {
		return fmt.Errorf("at least one torrent ID is required")
	}

	// Default to false if not specified
	deleteLocalData := false
	if req.DeleteLocalData != nil {
		deleteLocalData = *req.DeleteLocalData
	}

	// Remove torrents
	log.Printf("Removing torrents with IDs: %v, deleteLocalData: %v", req.IDs, deleteLocalData)
	if err := s.transmissionClient.RemoveTorrents(ctx, req.IDs, deleteLocalData); err != nil {
		return fmt.Errorf("failed to remove torrents: %w", err)
	}

	// Force sync to update the database
	if err := s.syncService.ForceSync(); err != nil {
		log.Printf("Failed to sync after removing torrents: %v", err)
	}

	return nil
}

// PerformAction performs an action on a single torrent
func (s *Service) PerformAction(ctx context.Context, torrentID string, req ActionRequest) error {
	if s.transmissionClient == nil {
		return fmt.Errorf("transmission client not available")
	}

	if torrentID == "" {
		return fmt.Errorf("torrent ID is required")
	}

	// Resolve to Transmission ID (accepts numeric Transmission ID or PocketBase record id)
	var id int64
	if _, err := fmt.Sscanf(torrentID, "%d", &id); err != nil {
		// Not a number; try treating as PocketBase record id
		collection, cerr := s.app.FindCollectionByNameOrId("torrents")
		if cerr != nil {
			return fmt.Errorf("invalid torrent ID")
		}
		rec, rerr := s.app.FindRecordById(collection, torrentID, nil)
		if rerr != nil {
			return fmt.Errorf("torrent not found")
		}
		// transmissionId is stored as number in the record
		id = int64(rec.GetInt("transmissionId"))
		if id == 0 {
			return fmt.Errorf("record missing transmissionId")
		}
	}

	switch req.Action {
	case "start":
		if err := s.transmissionClient.StartTorrents(ctx, []int64{id}); err != nil {
			return fmt.Errorf("failed to start torrent: %w", err)
		}
	case "stop":
		if err := s.transmissionClient.StopTorrents(ctx, []int64{id}); err != nil {
			return fmt.Errorf("failed to stop torrent: %w", err)
		}
	case "remove":
		// Check for deleteLocalData parameter
		deleteLocalData := false
		if req.Params != nil {
			if val, ok := req.Params["deleteLocalData"].(bool); ok {
				deleteLocalData = val
			}
		}
		if err := s.transmissionClient.RemoveTorrents(ctx, []int64{id}, deleteLocalData); err != nil {
			return fmt.Errorf("failed to remove torrent: %w", err)
		}
	default:
		return fmt.Errorf("invalid action: %s", req.Action)
	}

	// Force sync to update the database
	if err := s.syncService.ForceSync(); err != nil {
		log.Printf("Failed to sync after %s action: %v", req.Action, err)
	}

	return nil
}

// ForceSync triggers an immediate synchronization
func (s *Service) ForceSync() error {
	if s.syncService == nil {
		return fmt.Errorf("transmission client not available")
	}

	if err := s.syncService.ForceSync(); err != nil {
		return fmt.Errorf("sync failed: %w", err)
	}

	return nil
}