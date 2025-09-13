package transmission

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	"github.com/pocketbase/pocketbase/core"
)

// MockClient simulates a Transmission client for demo/testing purposes
type MockClient struct {
	app           core.App
	torrents      []*TorrentData
	lastUpdate    time.Time
}

// NewMockClient creates a new mock Transmission client
func NewMockClient(app core.App) *MockClient {
	return &MockClient{
		app:        app,
		torrents:   generateMockTorrents(),
		lastUpdate: time.Now(),
	}
}

// GetTorrents returns mock torrent data with simulated progress updates
func (m *MockClient) GetTorrents(ctx context.Context) ([]*TorrentData, error) {
	// Simulate progress updates
	now := time.Now()
	if now.Sub(m.lastUpdate) > 2*time.Second {
		m.updateMockProgress()
		m.lastUpdate = now
	}
	
	return m.torrents, nil
}

// AddTorrent simulates adding a new torrent
func (m *MockClient) AddTorrent(ctx context.Context, torrentData string, downloadDir *string) (*TorrentData, error) {
	newTorrent := &TorrentData{
		ID:               int64(len(m.torrents) + 1),
		Name:             fmt.Sprintf("New Torrent %d", len(m.torrents)+1),
		HashString:       fmt.Sprintf("mock_hash_%d", len(m.torrents)+1),
		Status:           StatusDownload,
		PercentDone:      0.0,
		SizeWhenDone:     1024 * 1024 * 1024, // 1GB
		RateDownload:     1024 * 1024,        // 1MB/s
		RateUpload:       0,
		UploadRatio:      0.0,
		ETA:              3600, // 1 hour
		TotalSize:        1024 * 1024 * 1024,
		DownloadedEver:   0,
		UploadedEver:     0,
		AddedDate:        time.Now(),
	}
	
	m.torrents = append(m.torrents, newTorrent)
	return newTorrent, nil
}

// StartTorrents simulates starting torrents
func (m *MockClient) StartTorrents(ctx context.Context, ids []int64) error {
	for _, id := range ids {
		for _, t := range m.torrents {
			if t.ID == id {
				if t.Status == StatusStopped {
					t.Status = StatusDownload
					t.RateDownload = int64(rand.Intn(5*1024*1024)) // 0-5MB/s
				}
			}
		}
	}
	return nil
}

// StopTorrents simulates stopping torrents
func (m *MockClient) StopTorrents(ctx context.Context, ids []int64) error {
	for _, id := range ids {
		for _, t := range m.torrents {
			if t.ID == id {
				t.Status = StatusStopped
				t.RateDownload = 0
				t.RateUpload = 0
			}
		}
	}
	return nil
}

// RemoveTorrents simulates removing torrents
func (m *MockClient) RemoveTorrents(ctx context.Context, ids []int64, deleteLocalData bool) error {
	// Mark as removed rather than actually removing from slice for demo
	for _, id := range ids {
		for _, t := range m.torrents {
			if t.ID == id {
				t.Status = "removed"
			}
		}
	}
	return nil
}

// GetSessionStats returns mock session statistics
func (m *MockClient) GetSessionStats(ctx context.Context) (interface{}, error) {
	return map[string]interface{}{
		"downloadSpeed": 2 * 1024 * 1024, // 2MB/s
		"uploadSpeed":   1024 * 1024,     // 1MB/s
		"torrentCount":  len(m.torrents),
	}, nil
}

// generateMockTorrents creates sample torrent data for demo
func generateMockTorrents() []*TorrentData {
	return []*TorrentData{
		{
			ID:             1,
			Name:           "Ubuntu 24.04 LTS Desktop amd64.iso",
			HashString:     "mock_hash_ubuntu_24_04",
			Status:         StatusDownload,
			PercentDone:    0.65,
			SizeWhenDone:   4294967296, // 4GB
			RateDownload:   2097152,    // 2MB/s
			RateUpload:     0,
			UploadRatio:    0.0,
			ETA:            1800, // 30 minutes
			TotalSize:      4294967296,
			DownloadedEver: 2791728742, // 65% of 4GB
			UploadedEver:   0,
			AddedDate:      time.Now().Add(-2 * time.Hour),
		},
		{
			ID:             2,
			Name:           "Big Buck Bunny 4K (2008).mkv",
			HashString:     "mock_hash_big_buck_bunny",
			Status:         StatusSeed,
			PercentDone:    1.0,
			SizeWhenDone:   8589934592, // 8GB
			RateDownload:   0,
			RateUpload:     524288, // 512KB/s
			UploadRatio:    1.8,
			ETA:            -1, // Complete
			TotalSize:      8589934592,
			DownloadedEver: 8589934592,
			UploadedEver:   15461882265, // 1.8 * 8GB
			AddedDate:      time.Now().Add(-24 * time.Hour),
			DoneDate:       func() *time.Time { t := time.Now().Add(-12 * time.Hour); return &t }(),
		},
		{
			ID:             3,
			Name:           "Linux.Kernel.Source.tar.xz",
			HashString:     "mock_hash_linux_kernel",
			Status:         StatusStopped,
			PercentDone:    0.12,
			SizeWhenDone:   209715200, // 200MB
			RateDownload:   0,
			RateUpload:     0,
			UploadRatio:    0.0,
			ETA:            -1, // Unknown (stopped)
			TotalSize:      209715200,
			DownloadedEver: 25165824, // 12% of 200MB
			UploadedEver:   0,
			AddedDate:      time.Now().Add(-30 * time.Minute),
		},
	}
}

// updateMockProgress simulates progress updates
func (m *MockClient) updateMockProgress() {
	for _, t := range m.torrents {
		if t.Status == StatusDownload && t.PercentDone < 1.0 {
			// Increase progress by 1-3%
			progress := 0.01 + rand.Float64()*0.02
			t.PercentDone = min(1.0, t.PercentDone+progress)
			t.DownloadedEver = int64(t.PercentDone * float64(t.TotalSize))
			
			// Calculate ETA
			if t.RateDownload > 0 {
				remaining := t.TotalSize - t.DownloadedEver
				t.ETA = remaining / t.RateDownload
			}
			
			// Complete torrent
			if t.PercentDone >= 1.0 {
				t.Status = StatusSeed
				t.RateDownload = 0
				t.RateUpload = int64(rand.Intn(1024*1024)) // 0-1MB/s upload
				t.ETA = -1
				if t.DoneDate == nil {
					now := time.Now()
					t.DoneDate = &now
				}
			}
		}
		
		// Simulate upload ratio changes for seeding torrents
		if t.Status == StatusSeed && t.RateUpload > 0 {
			uploaded := float64(t.RateUpload) * 5.0 // 5 seconds worth
			t.UploadedEver += int64(uploaded)
			t.UploadRatio = float64(t.UploadedEver) / float64(t.TotalSize)
		}
	}
}

func min(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}