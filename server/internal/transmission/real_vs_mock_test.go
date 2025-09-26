package transmission

import (
	"context"
	"encoding/base64"
	"log"
	"strings"
	"testing"
)

// Test the actual distinction between magnet links and torrent file uploads
func TestAddTorrentRealVsMock(t *testing.T) {
	// This test will help us understand the difference between real and mock behavior
	
	// Test data
	magnetLink := "magnet:?xt=urn:btih:abcdef1234567890abcdef1234567890abcdef12&dn=test"
	torrentContent := "d8:announce27:http://tracker.example.com:880813:creation datei1640995200e4:infod4:name8:test.txt12:piece lengthi32768e6:pieces20:aaaaaaaaaaaaaaaaaaaa11:single filei1024eee"
	encodedTorrent := base64.StdEncoding.EncodeToString([]byte(torrentContent))
	
	log.Printf("Test data prepared:")
	log.Printf("Magnet link: %s", magnetLink)
	log.Printf("Torrent content: %s", torrentContent)
	log.Printf("Base64 encoded: %s", encodedTorrent)
	
	// Test with mock client
	log.Printf("\n=== Testing with Mock Client ===")
	mockClient := NewMockClient(nil)
	
	// Test magnet with mock
	result1, err1 := mockClient.AddTorrent(context.Background(), magnetLink, nil)
	if err1 != nil {
		t.Errorf("Mock client failed with magnet: %v", err1)
	} else {
		log.Printf("Mock magnet result: ID=%d, Name=%s", result1.ID, result1.Name)
	}
	
	// Test torrent file with mock
	result2, err2 := mockClient.AddTorrent(context.Background(), encodedTorrent, nil)
	if err2 != nil {
		t.Errorf("Mock client failed with torrent file: %v", err2)
	} else {
		log.Printf("Mock torrent file result: ID=%d, Name=%s", result2.ID, result2.Name)
	}
	
	// Test logic for determining if it's a magnet or torrent file
	log.Printf("\n=== Testing Detection Logic ===")
	isMagnet1 := strings.HasPrefix(magnetLink, "magnet:")
	isMagnet2 := strings.HasPrefix(encodedTorrent, "magnet:")
	log.Printf("'%s' is magnet: %t", magnetLink, isMagnet1)
	log.Printf("'%s' is magnet: %t", encodedTorrent, isMagnet2)
	
	// Test base64 validation
	log.Printf("\n=== Testing Base64 Validation ===")
	_, err3 := base64.StdEncoding.DecodeString(encodedTorrent)
	if err3 != nil {
		t.Errorf("Valid base64 failed validation: %v", err3)
	} else {
		log.Printf("Base64 validation successful")
	}
	
	// Test with invalid base64
	invalidB64 := "not_base64_at_all!"
	_, err4 := base64.StdEncoding.DecodeString(invalidB64)
	if err4 == nil {
		t.Errorf("Invalid base64 passed validation")
	} else {
		log.Printf("Invalid base64 correctly rejected: %v", err4)
	}
}

// Test what happens when we try to decode the torrent content  
func TestTorrentContentValidation(t *testing.T) {
	// Real-world torrent file structure (simplified bencoded format)
	realTorrentContent := `d8:announce35:http://torrent.ubuntu.com:6969/announce13:announce-listll35:http://torrent.ubuntu.com:6969/announceel40:http://ipv6.torrent.ubuntu.com:6969/announceee7:comment29:Ubuntu CD releases.ubuntu.com13:creation datei1634659200e4:infod6:lengthi3654957056e4:name31:ubuntu-21.10-desktop-amd64.iso12:piece lengthi524288e6:pieces27560:xxxxxpiecehashesgoherexxxxxee`
	
	log.Printf("Testing real torrent content validation...")
	log.Printf("Content length: %d", len(realTorrentContent))
	
	// Encode it
	encoded := base64.StdEncoding.EncodeToString([]byte(realTorrentContent))
	log.Printf("Encoded length: %d", len(encoded))
	
	// Validate round-trip
	decoded, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		t.Errorf("Failed to decode: %v", err)
	}
	
	if string(decoded) != realTorrentContent {
		t.Errorf("Round-trip failed: decoded content doesn't match original")
	} else {
		log.Printf("Round-trip successful")
	}
	
	// Test the mock client with this more realistic data
	mockClient := NewMockClient(nil)
	result, err := mockClient.AddTorrent(context.Background(), encoded, nil)
	if err != nil {
		t.Errorf("Mock failed with realistic torrent: %v", err)
	} else {
		log.Printf("Mock succeeded with realistic torrent: ID=%d, Name=%s", result.ID, result.Name)
	}
}