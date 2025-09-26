package routes

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"strings"
	"testing"

	"backend/internal/torrent"
	"backend/internal/transmission"
)

// TestTorrentAddDataFlow tests the data flow without the sync service
func TestTorrentAddDataFlow(t *testing.T) {
	// Create mock client
	mockClient := transmission.NewMockClient(nil)

	// Create test torrent file data
	torrentContent := "d8:announce27:http://tracker.example.com:880813:creation datei1640995200e4:infod4:name12:test-upload12:piece lengthi32768e6:pieces20:aaaaaaaaaaaaaaaaaaaa11:single filei1024eee"
	encodedTorrent := base64.StdEncoding.EncodeToString([]byte(torrentContent))

	// Create request payload (exactly like frontend)
	requestPayload := map[string]interface{}{
		"torrent":     encodedTorrent,
		"downloadDir": nil,
		"autoStart":   true,
	}

	jsonBody, err := json.Marshal(requestPayload)
	if err != nil {
		t.Fatalf("Failed to marshal request payload: %v", err)
	}

	// Parse request like the handler would
	var torrentReq torrent.AddTorrentRequest
	err = json.Unmarshal(jsonBody, &torrentReq)
	if err != nil {
		t.Fatalf("Failed to unmarshal request: %v", err)
	}

	// Test the request structure
	t.Logf("Request structure:")
	t.Logf("- Torrent data length: %d", len(torrentReq.Torrent))
	t.Logf("- Download dir: %v", torrentReq.DownloadDir)
	t.Logf("- Auto start: %v", torrentReq.AutoStart)
	t.Logf("- Is base64: %t", torrentReq.Torrent != "" && !strings.HasPrefix(torrentReq.Torrent, "magnet:"))

	// Validate base64
	decoded, err := base64.StdEncoding.DecodeString(torrentReq.Torrent)
	if err != nil {
		t.Errorf("Base64 validation failed: %v", err)
	} else {
		t.Logf("Base64 validation successful, decoded length: %d", len(decoded))
		if string(decoded) == torrentContent {
			t.Logf("Round-trip validation successful")
		} else {
			t.Errorf("Round-trip validation failed")
		}
	}

	// Test the client call directly (without sync service)
	ctx := context.Background()
	result, err := mockClient.AddTorrent(ctx, torrentReq.Torrent, torrentReq.DownloadDir)
	if err != nil {
		t.Errorf("MockClient.AddTorrent failed: %v", err)
	} else {
		t.Logf("MockClient.AddTorrent succeeded: ID=%d, Name=%s", result.ID, result.Name)
		
		// Test auto-start
		if torrentReq.AutoStart != nil && *torrentReq.AutoStart {
			err = mockClient.StartTorrents(ctx, []int64{result.ID})
			if err != nil {
				t.Errorf("MockClient.StartTorrents failed: %v", err)
			} else {
				t.Logf("MockClient.StartTorrents succeeded for ID=%d", result.ID)
			}
		}
	}
}

func TestTorrentAddRouteWithMagnet(t *testing.T) {
	// Create mock client
	mockClient := transmission.NewMockClient(nil)

	// Create magnet link
	magnetLink := "magnet:?xt=urn:btih:abcdef1234567890abcdef1234567890abcdef12&dn=test-magnet"

	// Create request payload
	requestPayload := map[string]interface{}{
		"torrent":     magnetLink,
		"downloadDir": "/downloads",
		"autoStart":   false,
	}

	jsonBody, err := json.Marshal(requestPayload)
	if err != nil {
		t.Fatalf("Failed to marshal request payload: %v", err)
	}

	// Parse request like the handler would
	var torrentReq torrent.AddTorrentRequest
	err = json.Unmarshal(jsonBody, &torrentReq)
	if err != nil {
		t.Fatalf("Failed to unmarshal request: %v", err)
	}

	t.Logf("Magnet request structure:")
	t.Logf("- Torrent data: %s", torrentReq.Torrent)
	t.Logf("- Download dir: %v", torrentReq.DownloadDir)
	t.Logf("- Auto start: %v", torrentReq.AutoStart)
	t.Logf("- Is magnet: %t", strings.HasPrefix(torrentReq.Torrent, "magnet:"))

	// Test the client call directly
	ctx := context.Background()
	result, err := mockClient.AddTorrent(ctx, torrentReq.Torrent, torrentReq.DownloadDir)
	if err != nil {
		t.Errorf("MockClient.AddTorrent failed with magnet: %v", err)
	} else {
		t.Logf("MockClient.AddTorrent succeeded with magnet: ID=%d, Name=%s", result.ID, result.Name)
	}
}