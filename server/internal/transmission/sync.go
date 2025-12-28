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
	app       core.App
	client    TransmissionClient
	interval  time.Duration
	ctx       context.Context
	cancel    context.CancelFunc
	mu        sync.RWMutex
	lastSync  time.Time
	isRunning bool
}

// NewSyncService creates a new sync service
func NewSyncService(app core.App, client TransmissionClient, interval time.Duration) *SyncService {
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
	if s.isRunning {
		s.mu.Unlock()
		return fmt.Errorf("sync service is already running")
	}
	s.isRunning = true
	s.mu.Unlock()

	log.Printf("Starting Transmission sync service with interval: %v", s.interval)

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
	// Run initial sync immediately
	if err := s.syncOnce(); err != nil {
		log.Printf("Initial sync failed: %v", err)
	}

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

	// Add a timeout to the context
	ctx, cancel := context.WithTimeout(s.ctx, 10*time.Second)
	defer cancel()

	// Get torrents from Transmission
	torrents, err := s.client.GetTorrents(ctx)

	log.Println("Torrents", len(torrents))
	log.Println("Error", err)

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
	log.Println("Updating torrents in DB...")
	collection, err := s.app.FindCollectionByNameOrId("torrents")
	if err != nil {
		return fmt.Errorf("torrents collection not found: %w", err)
	}

	log.Println("Fetching existing torrent records from database...")
	// Get existing torrents by hash
	existingTorrentsByHash := make(map[string]*core.Record)
	existingTorrentsByID := make(map[int64]*core.Record)
	existingRecords := make(map[string]*core.Record)

	records, err := s.app.FindRecordsByFilter(collection, "", "", 0, 0, nil)
	if err != nil {
		return fmt.Errorf("failed to fetch existing torrents: %w", err)
	}
	log.Printf("Fetched %d existing torrent records.", len(records))

	for _, record := range records {
		existingRecords[record.Id] = record
		hash := record.GetString("hash")
		if hash != "" {
			existingTorrentsByHash[hash] = record
		}

		transmissionID := record.GetInt("transmissionId")
		if transmissionID != 0 {
			existingTorrentsByID[int64(transmissionID)] = record
		}
	}

	// Track current transmission torrent hashes
	currentHashes := make(map[string]bool)

	log.Println("Processing torrents from Transmission...")
	// Update or create torrents
	for _, torrent := range torrents {
		currentHashes[torrent.HashString] = true

		var (
			record *core.Record
			exists bool
		)

		if torrent.HashString != "" {
			record, exists = existingTorrentsByHash[torrent.HashString]
		}

		if !exists && torrent.ID != 0 {
			record, exists = existingTorrentsByID[torrent.ID]
		}

		if exists {
			// Update existing record
			if err := s.updateTorrentRecord(record, torrent); err != nil {
				log.Printf("Failed to update torrent %s: %v", torrent.Name, err)
				continue
			}

			delete(existingRecords, record.Id)
		} else {
			// Create new record
			if err := s.createTorrentRecord(collection, torrent); err != nil {
				log.Printf("Failed to create torrent %s: %v", torrent.Name, err)
				continue
			}
		}
	}
	log.Println("Finished processing torrents from Transmission.")

	log.Println("Checking for torrents removed from Transmission...")
	// Hard delete records for torrents that no longer exist in Transmission
	for _, record := range existingRecords {
		hash := record.GetString("hash")
		if hash != "" && !currentHashes[hash] {
			// Torrent was removed from Transmission -> delete the DB record
			if err := s.app.Delete(record); err != nil {
				if hash != "" {
					log.Printf("Failed to delete torrent record (hash: %s): %v", hash, err)
				} else {
					log.Printf("Failed to delete torrent record (id: %s): %v", record.Id, err)
				}
			}
		}
	}
	log.Println("Finished checking for removed torrents.")

	return nil
}

// updateTorrentRecord updates an existing torrent record
func (s *SyncService) updateTorrentRecord(record *core.Record, torrent *TorrentData) error {
	// Check if any significant field has changed
	changed := false

	// Check metadata fields (important for magnet torrents that get metadata later)
	if torrent.Name != "" && record.GetString("name") != torrent.Name {
		record.Set("name", torrent.Name)
		changed = true
	}

	if record.GetInt("sizeWhenDone") != int(torrent.SizeWhenDone) {
		record.Set("sizeWhenDone", torrent.SizeWhenDone)
		changed = true
	}

	if record.GetInt("totalSize") != int(torrent.TotalSize) {
		record.Set("totalSize", torrent.TotalSize)
		changed = true
	}

	if record.GetString("status") != string(torrent.Status) {
		record.Set("status", string(torrent.Status))
		changed = true
	}

	if record.GetFloat("percentDone") != torrent.PercentDone {
		record.Set("percentDone", torrent.PercentDone)
		changed = true
	}

	if torrent.HashString != "" && record.GetString("hash") != torrent.HashString {
		record.Set("hash", torrent.HashString)
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

	// Ensure transmissionId stays in sync (important when torrent is re-added and gets a new ID)
	if record.GetInt("transmissionId") != int(torrent.ID) {
		record.Set("transmissionId", torrent.ID)
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

	name := torrent.Name
	if name == "" {
		switch {
		case torrent.HashString != "":
			name = torrent.HashString
		case torrent.ID != 0:
			name = fmt.Sprintf("Torrent %d", torrent.ID)
		default:
			name = "Pending torrent"
		}
	}

	hash := torrent.HashString
	if hash == "" {
		hash = generatePlaceholderHash(torrent.ID)
	}

	record.Set("transmissionId", torrent.ID)
	record.Set("name", name)
	record.Set("hash", hash)
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
	// Ensure 'updated' field is set on creation for proper sorting in UI
	record.Set("updated", time.Now())

	if torrent.DoneDate != nil {
		record.Set("doneDate", *torrent.DoneDate)
	}

	return s.app.Save(record)
}

// ForceSync triggers an immediate synchronization
func (s *SyncService) ForceSync() error {
	return s.syncOnce()
}

// generatePlaceholderHash generates a placeholder hash for torrents without metadata
func generatePlaceholderHash(id int64) string {
	return fmt.Sprintf("placeholder-%d", id)
}
