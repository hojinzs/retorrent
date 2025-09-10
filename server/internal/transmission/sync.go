package transmission

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/pocketbase/pocketbase/core"
)

// SyncService handles periodic synchronization between Transmission and PocketBase
type SyncService struct {
	app           core.App
	client        *Client
	interval      time.Duration
	ctx           context.Context
	cancel        context.CancelFunc
	mu            sync.RWMutex
	lastSync      time.Time
	isRunning     bool
}

// NewSyncService creates a new sync service
func NewSyncService(app core.App, client *Client, interval time.Duration) *SyncService {
	ctx, cancel := context.WithCancel(context.Background())
	
	return &SyncService{
		app:      app,
		client:   client,
		interval: interval,
		ctx:      ctx,
		cancel:   cancel,
	}
}

// Start begins the periodic synchronization
func (s *SyncService) Start() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.isRunning {
		return fmt.Errorf("sync service is already running")
	}

	s.isRunning = true
	
	log.Printf("Starting Transmission sync service with interval: %v", s.interval)
	
	// Run initial sync
	if err := s.syncOnce(); err != nil {
		log.Printf("Initial sync failed: %v", err)
	}

	// Start periodic sync
	go s.syncLoop()
	
	return nil
}

// Stop stops the synchronization service
func (s *SyncService) Stop() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if !s.isRunning {
		return
	}

	log.Println("Stopping Transmission sync service")
	s.cancel()
	s.isRunning = false
}

// IsRunning returns whether the service is currently running
func (s *SyncService) IsRunning() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.isRunning
}

// LastSyncTime returns the last successful sync time
func (s *SyncService) LastSyncTime() time.Time {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.lastSync
}

// syncLoop runs the periodic synchronization
func (s *SyncService) syncLoop() {
	ticker := time.NewTicker(s.interval)
	defer ticker.Stop()

	for {
		select {
		case <-s.ctx.Done():
			log.Println("Sync service context cancelled")
			return
		case <-ticker.C:
			if err := s.syncOnce(); err != nil {
				log.Printf("Sync failed: %v", err)
			}
		}
	}
}

// syncOnce performs a single synchronization
func (s *SyncService) syncOnce() error {
	log.Println("Starting Transmission sync...")
	
	// Get torrents from Transmission
	torrents, err := s.client.GetTorrents(s.ctx)
	if err != nil {
		return fmt.Errorf("failed to get torrents from Transmission: %w", err)
	}

	// Update PocketBase with torrent data
	if err := s.updateTorrentsInDB(torrents); err != nil {
		return fmt.Errorf("failed to update torrents in database: %w", err)
	}

	s.mu.Lock()
	s.lastSync = time.Now()
	s.mu.Unlock()

	log.Printf("Sync completed successfully. Updated %d torrents", len(torrents))
	return nil
}

// updateTorrentsInDB updates the torrents collection in PocketBase
func (s *SyncService) updateTorrentsInDB(torrents []*TorrentData) error {
	collection, err := s.app.FindCollectionByNameOrId("torrents")
	if err != nil {
		return fmt.Errorf("torrents collection not found: %w", err)
	}

	// Get existing torrents by hash
	existingTorrents := make(map[string]*core.Record)
	records, err := s.app.FindRecordsByFilter(collection, "", "", 0, 0, nil)
	if err != nil {
		return fmt.Errorf("failed to fetch existing torrents: %w", err)
	}

	for _, record := range records {
		hash := record.GetString("hash")
		if hash != "" {
			existingTorrents[hash] = record
		}
	}

	// Track current transmission torrent hashes
	currentHashes := make(map[string]bool)

	// Update or create torrents
	for _, torrent := range torrents {
		currentHashes[torrent.HashString] = true
		
		record, exists := existingTorrents[torrent.HashString]
		if exists {
			// Update existing record
			if err := s.updateTorrentRecord(record, torrent); err != nil {
				log.Printf("Failed to update torrent %s: %v", torrent.Name, err)
				continue
			}
		} else {
			// Create new record
			if err := s.createTorrentRecord(collection, torrent); err != nil {
				log.Printf("Failed to create torrent %s: %v", torrent.Name, err)
				continue
			}
		}
	}

	// Mark removed torrents as inactive or delete them
	for hash, record := range existingTorrents {
		if !currentHashes[hash] {
			// Torrent was removed from Transmission
			record.Set("status", "removed")
			record.Set("updated", time.Now())
			
			if err := s.app.Save(record); err != nil {
				log.Printf("Failed to mark torrent as removed (hash: %s): %v", hash, err)
			}
		}
	}

	return nil
}

// updateTorrentRecord updates an existing torrent record
func (s *SyncService) updateTorrentRecord(record *core.Record, torrent *TorrentData) error {
	// Check if any significant field has changed
	changed := false
	
	if record.GetString("status") != string(torrent.Status) {
		record.Set("status", string(torrent.Status))
		changed = true
	}
	
	if record.GetFloat("percentDone") != torrent.PercentDone {
		record.Set("percentDone", torrent.PercentDone)
		changed = true
	}
	
	if record.GetInt("rateDownload") != int(torrent.RateDownload) {
		record.Set("rateDownload", torrent.RateDownload)
		changed = true
	}
	
	if record.GetInt("rateUpload") != int(torrent.RateUpload) {
		record.Set("rateUpload", torrent.RateUpload)
		changed = true
	}
	
	if record.GetFloat("uploadRatio") != torrent.UploadRatio {
		record.Set("uploadRatio", torrent.UploadRatio)
		changed = true
	}

	// Always update these fields
	record.Set("eta", torrent.ETA)
	record.Set("downloadedEver", torrent.DownloadedEver)
	record.Set("uploadedEver", torrent.UploadedEver)
	record.Set("error", torrent.Error)
	record.Set("errorString", torrent.ErrorString)
	record.Set("transmissionData", torrent)
	record.Set("updated", time.Now())

	if torrent.DoneDate != nil && record.GetDateTime("doneDate").IsZero() {
		record.Set("doneDate", *torrent.DoneDate)
		changed = true
	}

	// Only save if there were significant changes or if it's been a while
	lastUpdated := record.GetDateTime("updated")
	if changed || time.Since(lastUpdated.Time()) > 5*time.Minute {
		return s.app.Save(record)
	}

	return nil
}

// createTorrentRecord creates a new torrent record
func (s *SyncService) createTorrentRecord(collection *core.Collection, torrent *TorrentData) error {
	record := core.NewRecord(collection)
	
	record.Set("transmissionId", torrent.ID)
	record.Set("name", torrent.Name)
	record.Set("hash", torrent.HashString)
	record.Set("status", string(torrent.Status))
	record.Set("percentDone", torrent.PercentDone)
	record.Set("sizeWhenDone", torrent.SizeWhenDone)
	record.Set("totalSize", torrent.TotalSize)
	record.Set("rateDownload", torrent.RateDownload)
	record.Set("rateUpload", torrent.RateUpload)
	record.Set("uploadRatio", torrent.UploadRatio)
	record.Set("eta", torrent.ETA)
	record.Set("downloadedEver", torrent.DownloadedEver)
	record.Set("uploadedEver", torrent.UploadedEver)
	record.Set("addedDate", torrent.AddedDate)
	record.Set("error", torrent.Error)
	record.Set("errorString", torrent.ErrorString)
	record.Set("transmissionData", torrent)

	if torrent.DoneDate != nil {
		record.Set("doneDate", *torrent.DoneDate)
	}

	return s.app.Save(record)
}

// ForceSync triggers an immediate synchronization
func (s *SyncService) ForceSync() error {
	return s.syncOnce()
}