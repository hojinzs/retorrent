package transmission

import (
	"context"
	"encoding/base64"
	"log"
	"testing"
)

// Test specifically for torrent file upload issue
func TestAddTorrentFile(t *testing.T) {
	// Create a mock client for testing
	mockClient := NewMockClient(nil)

	// Test 1: Test with magnet link (should work)
	magnetLink := "magnet:?xt=urn:btih:abcdef1234567890"
	torrentData1, err1 := mockClient.AddTorrent(context.Background(), magnetLink, nil)
	if err1 != nil {
		t.Errorf("Failed to add magnet link: %v", err1)
	}
	if torrentData1 == nil {
		t.Error("AddTorrent returned nil for magnet link")
	} else {
		log.Printf("Successfully added magnet: ID=%d, Name=%s", torrentData1.ID, torrentData1.Name)
	}

	// Test 2: Test with base64 encoded torrent file data (the issue case)
	// Create a minimal valid bencoded torrent file content
	torrentContent := "d8:announce9:test:1234e"
	encodedTorrent := base64.StdEncoding.EncodeToString([]byte(torrentContent))
	
	log.Printf("Testing base64 torrent upload:")
	log.Printf("Original content: %s", torrentContent)
	log.Printf("Base64 encoded: %s", encodedTorrent)

	torrentData2, err2 := mockClient.AddTorrent(context.Background(), encodedTorrent, nil)
	if err2 != nil {
		t.Errorf("Failed to add torrent file: %v", err2)
	}
	if torrentData2 == nil {
		t.Error("AddTorrent returned nil for torrent file")
	} else {
		log.Printf("Successfully added torrent file: ID=%d, Name=%s", torrentData2.ID, torrentData2.Name)
	}

	// Test 3: Test with auto-start option
	torrentData3, err3 := mockClient.AddTorrent(context.Background(), encodedTorrent, nil)
	if err3 != nil {
		t.Errorf("Failed to add torrent file with auto-start: %v", err3)
	}
	if torrentData3 == nil {
		t.Error("AddTorrent returned nil for torrent file with auto-start")
	} else {
		log.Printf("Successfully added torrent file with auto-start: ID=%d, Name=%s", torrentData3.ID, torrentData3.Name)
		
		// Test starting the torrent
		err4 := mockClient.StartTorrents(context.Background(), []int64{torrentData3.ID})
		if err4 != nil {
			t.Errorf("Failed to start torrent: %v", err4)
		} else {
			log.Printf("Successfully started torrent ID=%d", torrentData3.ID)
		}
	}
}