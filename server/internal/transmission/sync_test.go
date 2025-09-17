package transmission

import (
	"testing"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tests"
)

func TestUpdateTorrentRecordMetadata(t *testing.T) {
	testApp, _ := tests.NewTestApp()
	defer testApp.Cleanup()

	// Create a basic collection for testing
	collection := core.NewBaseCollection("test_torrents")
	collection.Fields.Add(&core.TextField{Name: "name", Required: true, Max: 500})
	collection.Fields.Add(&core.NumberField{Name: "sizeWhenDone", Required: false})
	collection.Fields.Add(&core.NumberField{Name: "totalSize", Required: false})
	collection.Fields.Add(&core.SelectField{
		Name:     "status",
		Required: true,
		Values:   []string{"stopped", "download", "seed"},
	})
	collection.Fields.Add(&core.NumberField{Name: "percentDone", Required: false})
	collection.Fields.Add(&core.NumberField{Name: "transmissionId", Required: true})
	collection.Fields.Add(&core.NumberField{Name: "rateDownload", Required: false})
	collection.Fields.Add(&core.NumberField{Name: "rateUpload", Required: false})
	collection.Fields.Add(&core.NumberField{Name: "uploadRatio", Required: false})
	collection.Fields.Add(&core.NumberField{Name: "eta", Required: false})
	collection.Fields.Add(&core.NumberField{Name: "downloadedEver", Required: false})
	collection.Fields.Add(&core.NumberField{Name: "uploadedEver", Required: false})
	collection.Fields.Add(&core.TextField{Name: "error", Required: false, Max: 500})
	collection.Fields.Add(&core.TextField{Name: "errorString", Required: false, Max: 1000})
	collection.Fields.Add(&core.JSONField{Name: "transmissionData", Required: false})
	collection.Fields.Add(&core.AutodateField{Name: "updated", OnUpdate: true})

	if err := testApp.Save(collection); err != nil {
		t.Fatalf("Failed to create test collection: %v", err)
	}

	// Create a sync service
	mockClient := NewMockClient(testApp)
	syncService := NewSyncService(testApp, mockClient, 0) // 0 interval for test

	// Create a record that simulates a magnet torrent with minimal metadata
	record := core.NewRecord(collection)
	record.Set("transmissionId", int64(1))
	record.Set("name", "magnet:?xt=urn:btih:abcdef1234567890") // Hash as name initially
	record.Set("sizeWhenDone", int64(0))                       // No size info yet
	record.Set("totalSize", int64(0))                          // No size info yet
	record.Set("status", "download")
	record.Set("percentDone", 0.0)
	record.Set("rateDownload", int64(0))
	record.Set("rateUpload", int64(0))
	record.Set("uploadRatio", 0.0)
	record.Set("eta", int64(0))
	record.Set("downloadedEver", int64(0))
	record.Set("uploadedEver", int64(0))
	record.Set("error", "")
	record.Set("errorString", "")
	record.Set("transmissionData", map[string]interface{}{})

	if err := testApp.Save(record); err != nil {
		t.Fatalf("Failed to save test record: %v", err)
	}

	// Create torrent data that has complete metadata (as would happen after metadata download)
	torrentData := &TorrentData{
		ID:             1,
		Name:           "Ubuntu 24.04 LTS Desktop amd64.iso", // Real name now available
		HashString:     "abcdef1234567890",
		Status:         StatusDownload,
		PercentDone:    0.25,       // Progress has changed too
		SizeWhenDone:   4294967296, // 4GB - now has size info
		TotalSize:      4294967296, // 4GB - now has size info
		RateDownload:   2097152,    // 2MB/s
		RateUpload:     0,
		UploadRatio:    0.0,
		ETA:            1800,
		DownloadedEver: 1073741824, // 25% of 4GB
		UploadedEver:   0,
	}

	// Test the update function
	err := syncService.updateTorrentRecord(record, torrentData)
	if err != nil {
		t.Fatalf("updateTorrentRecord failed: %v", err)
	}

	// Verify that the metadata fields were updated
	if record.GetString("name") != "Ubuntu 24.04 LTS Desktop amd64.iso" {
		t.Errorf("Name was not updated. Expected: 'Ubuntu 24.04 LTS Desktop amd64.iso', got: '%s'", record.GetString("name"))
	}

	if record.GetInt("sizeWhenDone") != 4294967296 {
		t.Errorf("SizeWhenDone was not updated. Expected: 4294967296, got: %d", record.GetInt("sizeWhenDone"))
	}

	if record.GetInt("totalSize") != 4294967296 {
		t.Errorf("TotalSize was not updated. Expected: 4294967296, got: %d", record.GetInt("totalSize"))
	}

	if record.GetFloat("percentDone") != 0.25 {
		t.Errorf("PercentDone was not updated. Expected: 0.25, got: %f", record.GetFloat("percentDone"))
	}
}
