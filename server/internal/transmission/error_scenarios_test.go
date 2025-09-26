package transmission

import (
	"context"
	"encoding/base64"
	"log"
	"testing"
)

// TestAddTorrentErrorScenarios tests various error conditions that might occur
func TestAddTorrentErrorScenarios(t *testing.T) {
	mockClient := NewMockClient(nil)
	
	// Test 1: Empty torrent data
	log.Printf("=== Test 1: Empty torrent data ===")
	_, err1 := mockClient.AddTorrent(context.Background(), "", nil)
	// Mock doesn't validate input, but real client should
	log.Printf("Empty torrent result: %v", err1)
	
	// Test 2: Invalid base64
	log.Printf("=== Test 2: Invalid base64 ===")
	invalidB64 := "this is not base64!"
	_, err2 := mockClient.AddTorrent(context.Background(), invalidB64, nil)
	// Mock doesn't validate, but let's test our validation logic
	_, validationErr := base64.StdEncoding.DecodeString(invalidB64)
	log.Printf("Invalid base64 validation error: %v", validationErr)
	log.Printf("Mock result with invalid base64: %v", err2)
	
	// Test 3: Valid base64 but invalid torrent content
	log.Printf("=== Test 3: Valid base64, invalid torrent ===")
	invalidTorrent := base64.StdEncoding.EncodeToString([]byte("not a torrent file"))
	_, err3 := mockClient.AddTorrent(context.Background(), invalidTorrent, nil)
	log.Printf("Invalid torrent content result: %v", err3)
	
	// Test 4: Very large torrent data
	log.Printf("=== Test 4: Large torrent data ===")
	largeTorrent := make([]byte, 1024*1024) // 1MB of data
	for i := range largeTorrent {
		largeTorrent[i] = byte(i % 256)
	}
	largeTorrentB64 := base64.StdEncoding.EncodeToString(largeTorrent)
	log.Printf("Large torrent base64 length: %d", len(largeTorrentB64))
	_, err4 := mockClient.AddTorrent(context.Background(), largeTorrentB64, nil)
	log.Printf("Large torrent result: %v", err4)
	
	// Test 5: Torrent with special characters in name
	log.Printf("=== Test 5: Special characters in torrent ===")
	specialTorrent := "d8:announce27:http://tracker.example.com:880813:creation datei1640995200e4:infod4:name50:Test File [2023] (Korean: 테스트 파일).mkv12:piece lengthi32768e6:pieces20:aaaaaaaaaaaaaaaaaaaa11:single filei1024eee"
	specialTorrentB64 := base64.StdEncoding.EncodeToString([]byte(specialTorrent))
	_, err5 := mockClient.AddTorrent(context.Background(), specialTorrentB64, nil)
	log.Printf("Special characters result: %v", err5)
}

// TestStartTorrentScenarios tests various start torrent conditions
func TestStartTorrentScenarios(t *testing.T) {
	mockClient := NewMockClient(nil)
	
	// Add a torrent first
	torrentData, err := mockClient.AddTorrent(context.Background(), "ZDg6YW5ub3VuY2U5OnRlc3Q6MTIzNGU=", nil)
	if err != nil {
		t.Fatalf("Failed to add torrent for start test: %v", err)
	}
	
	log.Printf("=== Testing StartTorrents scenarios ===")
	
	// Test 1: Start valid torrent
	err1 := mockClient.StartTorrents(context.Background(), []int64{torrentData.ID})
	log.Printf("Start valid torrent result: %v", err1)
	
	// Test 2: Start non-existent torrent
	err2 := mockClient.StartTorrents(context.Background(), []int64{9999})
	log.Printf("Start non-existent torrent result: %v", err2)
	
	// Test 3: Start multiple torrents
	err3 := mockClient.StartTorrents(context.Background(), []int64{torrentData.ID, 9999})
	log.Printf("Start multiple torrents (1 valid, 1 invalid) result: %v", err3)
	
	// Test 4: Start empty list
	err4 := mockClient.StartTorrents(context.Background(), []int64{})
	log.Printf("Start empty list result: %v", err4)
}

// TestFullWorkflow tests the complete add + start workflow
func TestFullWorkflow(t *testing.T) {
	mockClient := NewMockClient(nil)
	
	log.Printf("=== Testing Full Add + Start Workflow ===")
	
	// Step 1: Add torrent (paused)
	torrentContent := "d8:announce27:http://tracker.example.com:880813:creation datei1640995200e4:infod4:name20:workflow-test.txt12:piece lengthi32768e6:pieces20:aaaaaaaaaaaaaaaaaaaa11:single filei1024eee"
	encodedContent := base64.StdEncoding.EncodeToString([]byte(torrentContent))
	
	log.Printf("Step 1: Adding torrent")
	torrentData, err1 := mockClient.AddTorrent(context.Background(), encodedContent, nil)
	if err1 != nil {
		t.Fatalf("Step 1 failed - AddTorrent error: %v", err1)
	}
	log.Printf("Step 1 success - Torrent added: ID=%d, Name=%s, Status=%s", torrentData.ID, torrentData.Name, torrentData.Status)
	
	// Step 2: Start the torrent
	log.Printf("Step 2: Starting torrent")
	err2 := mockClient.StartTorrents(context.Background(), []int64{torrentData.ID})
	if err2 != nil {
		t.Errorf("Step 2 failed - StartTorrents error: %v", err2)
	} else {
		log.Printf("Step 2 success - Torrent started")
	}
	
	// Step 3: Verify the status (in a real client, this would show the torrent as started)
	log.Printf("Step 3: Verifying final state")
	torrents, err3 := mockClient.GetTorrents(context.Background())
	if err3 != nil {
		t.Errorf("Step 3 failed - GetTorrents error: %v", err3)
	} else {
		for _, torrent := range torrents {
			if torrent.ID == torrentData.ID {
				log.Printf("Step 3 success - Final torrent state: ID=%d, Status=%s", torrent.ID, torrent.Status)
			}
		}
	}
}