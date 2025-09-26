package transmission

import (
	"context"
	"encoding/base64"
	"fmt"
	"log"
	"net/url"
	"strings"
	"time"

	"github.com/hekmon/cunits/v2"
	"github.com/hekmon/transmissionrpc/v3"
	"github.com/pocketbase/pocketbase/core"
)

// TorrentStatus represents the status of a torrent
type TorrentStatus string

const (
	StatusStopped      TorrentStatus = "stopped"
	StatusCheckWait    TorrentStatus = "checkWait"
	StatusCheck        TorrentStatus = "check"
	StatusDownloadWait TorrentStatus = "downloadWait"
	StatusDownload     TorrentStatus = "download"
	StatusSeedWait     TorrentStatus = "seedWait"
	StatusSeed         TorrentStatus = "seed"
)

// TorrentData represents torrent information from Transmission
type TorrentData struct {
	ID             int64         `json:"id"`
	Name           string        `json:"name"`
	HashString     string        `json:"hashString"`
	Status         TorrentStatus `json:"status"`
	PercentDone    float64       `json:"percentDone"`
	SizeWhenDone   int64         `json:"sizeWhenDone"`
	RateDownload   int64         `json:"rateDownload"`
	RateUpload     int64         `json:"rateUpload"`
	UploadRatio    float64       `json:"uploadRatio"`
	ETA            int64         `json:"eta"`
	TotalSize      int64         `json:"totalSize"`
	DownloadedEver int64         `json:"downloadedEver"`
	UploadedEver   int64         `json:"uploadedEver"`
	AddedDate      time.Time     `json:"addedDate"`
	DoneDate       *time.Time    `json:"doneDate,omitempty"`
	Error          string        `json:"error,omitempty"`
	ErrorString    string        `json:"errorString,omitempty"`
}

// Client wraps the Transmission RPC client
type Client struct {
	client *transmissionrpc.Client
	app    core.App
}

func bitsToBytes(bits *cunits.Bits) int64 {
	if bits == nil {
		return 0
	}

	return int64(uint64(*bits) / 8)
}

// NewClient creates a new Transmission client
func NewClient(app core.App, endpoint, username, password string) (*Client, error) {

	// 접속 정보 로그 출력
	log.Printf("Connecting to transmission: host=%s, username=%s", endpoint, username)

	u, err := url.Parse(endpoint)
	if err != nil {
		return nil, fmt.Errorf("invalid transmission endpoint: %w", err)
	}
	if username != "" || password != "" {
		u.User = url.UserPassword(username, password)
	}

	cfg := &transmissionrpc.Config{}

	client, err := transmissionrpc.New(u, cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create transmission client: %w", err)
	}

	return &Client{
		client: client,
		app:    app,
	}, nil
}

// GetTorrents fetches all torrents from Transmission
func (c *Client) GetTorrents(ctx context.Context) ([]*TorrentData, error) {
	torrents, err := c.client.TorrentGetAll(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get torrents: %w", err)
	}

	result := make([]*TorrentData, 0, len(torrents))
	for _, t := range torrents {
		var (
			id       int64
			name     string
			hash     string
			status   TorrentStatus
			pctDone  float64
			sizeDone int64
			rd       int64
			ru       int64
			ratio    float64
			eta      int64
			total    int64
			dlEver   int64
			ulEver   int64
			addedAt  time.Time
		)
		if t.ID != nil {
			id = int64(*t.ID)
		}
		if t.Name != nil {
			name = *t.Name
		}
		if t.HashString != nil {
			hash = *t.HashString
		}
		if t.Status != nil {
			status = mapTransmissionStatus(*t.Status)
		} else {
			status = StatusStopped
		}
		if t.PercentDone != nil {
			pctDone = *t.PercentDone
		}
		sizeDone = bitsToBytes(t.SizeWhenDone)
		if t.RateDownload != nil {
			rd = *t.RateDownload
		}
		if t.RateUpload != nil {
			ru = *t.RateUpload
		}
		if t.UploadRatio != nil {
			ratio = *t.UploadRatio
		}
		if t.ETA != nil {
			eta = int64(*t.ETA)
		}
		total = bitsToBytes(t.TotalSize)
		if t.DownloadedEver != nil {
			dlEver = *t.DownloadedEver
		}
		if t.UploadedEver != nil {
			ulEver = *t.UploadedEver
		}
		if t.AddedDate != nil {
			addedAt = *t.AddedDate
		}

		torrentData := &TorrentData{
			ID:             id,
			Name:           name,
			HashString:     hash,
			Status:         status,
			PercentDone:    pctDone,
			SizeWhenDone:   sizeDone,
			RateDownload:   rd,
			RateUpload:     ru,
			UploadRatio:    ratio,
			ETA:            eta,
			TotalSize:      total,
			DownloadedEver: dlEver,
			UploadedEver:   ulEver,
			AddedDate:      addedAt,
		}

		if t.DoneDate != nil && !t.DoneDate.IsZero() {
			torrentData.DoneDate = t.DoneDate
		}

		if t.Error != nil && *t.Error != 0 {
			torrentData.Error = fmt.Sprintf("Error code: %d", *t.Error)
		}

		if t.ErrorString != nil && *t.ErrorString != "" {
			torrentData.ErrorString = *t.ErrorString
		}

		result = append(result, torrentData)
	}

	return result, nil
}

// mapTransmissionStatus converts Transmission status codes to our enum
func mapTransmissionStatus(status transmissionrpc.TorrentStatus) TorrentStatus {
	switch status {
	case transmissionrpc.TorrentStatusStopped:
		return StatusStopped
	case transmissionrpc.TorrentStatusCheckWait:
		return StatusCheckWait
	case transmissionrpc.TorrentStatusCheck:
		return StatusCheck
	case transmissionrpc.TorrentStatusDownloadWait:
		return StatusDownloadWait
	case transmissionrpc.TorrentStatusDownload:
		return StatusDownload
	case transmissionrpc.TorrentStatusSeedWait:
		return StatusSeedWait
	case transmissionrpc.TorrentStatusSeed:
		return StatusSeed
	default:
		return StatusStopped
	}
}

// AddTorrent adds a new torrent by magnet link or base64-encoded torrent file
func (c *Client) AddTorrent(ctx context.Context, torrentData string, downloadDir *string) (*TorrentData, error) {
	// Create TorrentAddPayload - default to paused, will be started separately if needed
	payload := transmissionrpc.TorrentAddPayload{
		DownloadDir: downloadDir,
		// Always add as paused initially for consistent behavior
		// The service layer will start it if autoStart is requested
		Paused: func() *bool { p := true; return &p }(),
	}

	// Check if it's a magnet link or base64 torrent data
	if strings.HasPrefix(torrentData, "magnet:") {
		log.Printf("AddTorrent: Adding magnet link (length: %d)", len(torrentData))
		payload.Filename = &torrentData
	} else {
		// Assume it's base64 encoded torrent file data
		log.Printf("AddTorrent: Adding torrent file as base64 (length: %d)", len(torrentData))
		
		// Validate base64 format
		if _, err := base64.StdEncoding.DecodeString(torrentData); err != nil {
			log.Printf("AddTorrent: Invalid base64 data: %v", err)
			return nil, fmt.Errorf("invalid base64 torrent data: %w", err)
		}
		
		payload.MetaInfo = &torrentData
		log.Printf("AddTorrent: MetaInfo set with base64 data")
	}

	log.Printf("AddTorrent: Calling TorrentAdd with payload: DownloadDir=%v, HasFilename=%t, HasMetaInfo=%t, Paused=%t", 
		downloadDir, payload.Filename != nil, payload.MetaInfo != nil, payload.Paused != nil && *payload.Paused)

	// Add the torrent
	t, err := c.client.TorrentAdd(ctx, payload)
	if err != nil {
		log.Printf("AddTorrent: TorrentAdd failed: %v", err)
		// Categorize the error for better debugging
		errMsg := err.Error()
		if strings.Contains(errMsg, "connection refused") || strings.Contains(errMsg, "connect") {
			return nil, fmt.Errorf("failed to connect to transmission daemon: %w", err)
		}
		if strings.Contains(errMsg, "unauthorized") || strings.Contains(errMsg, "403") || strings.Contains(errMsg, "401") {
			return nil, fmt.Errorf("authentication failed with transmission daemon: %w", err)
		}
		if strings.Contains(errMsg, "invalid") || strings.Contains(errMsg, "malformed") {
			return nil, fmt.Errorf("invalid torrent data: %w", err)
		}
		return nil, fmt.Errorf("transmission RPC error: %w", err)
	}

	log.Printf("AddTorrent: TorrentAdd succeeded, processing response...")
	if t.ID == nil {
		log.Printf("AddTorrent: WARNING - TorrentAdd returned response with nil ID")
		return nil, fmt.Errorf("transmission returned torrent data with nil ID")
	}

	// Safely map fields that may be nil in the add response
	var (
		id       int64
		name     string
		hash     string
		status   TorrentStatus
		pctDone  float64
		sizeDone int64
		rd       int64
		ru       int64
		ratio    float64
		eta      int64
		total    int64
		dlEver   int64
		ulEver   int64
		addedAt  time.Time
	)
	
	log.Printf("AddTorrent: Processing response fields...")
	if t.ID != nil {
		id = int64(*t.ID)
		log.Printf("AddTorrent: Got ID: %d", id)
	} else {
		log.Printf("AddTorrent: WARNING - ID is nil")
	}
	if t.Name != nil {
		name = *t.Name
		log.Printf("AddTorrent: Got Name: %s", name)
	} else {
		log.Printf("AddTorrent: WARNING - Name is nil")
	}
	if t.HashString != nil {
		hash = *t.HashString
		log.Printf("AddTorrent: Got HashString: %s", hash)
	} else {
		log.Printf("AddTorrent: WARNING - HashString is nil")
	}
	if t.Status != nil {
		status = mapTransmissionStatus(*t.Status)
	} else {
		status = StatusStopped
	}
	if t.PercentDone != nil {
		pctDone = *t.PercentDone
	}
	sizeDone = bitsToBytes(t.SizeWhenDone)
	if t.RateDownload != nil {
		rd = *t.RateDownload
	}
	if t.RateUpload != nil {
		ru = *t.RateUpload
	}
	if t.UploadRatio != nil {
		ratio = *t.UploadRatio
	}
	if t.ETA != nil {
		eta = int64(*t.ETA)
	}
	total = bitsToBytes(t.TotalSize)
	if t.DownloadedEver != nil {
		dlEver = *t.DownloadedEver
	}
	if t.UploadedEver != nil {
		ulEver = *t.UploadedEver
	}
	if t.AddedDate != nil {
		addedAt = *t.AddedDate
	}

	result := &TorrentData{
		ID:             id,
		Name:           name,
		HashString:     hash,
		Status:         status,
		PercentDone:    pctDone,
		SizeWhenDone:   sizeDone,
		RateDownload:   rd,
		RateUpload:     ru,
		UploadRatio:    ratio,
		ETA:            eta,
		TotalSize:      total,
		DownloadedEver: dlEver,
		UploadedEver:   ulEver,
		AddedDate:      addedAt,
	}

	log.Printf("AddTorrent: Created TorrentData - ID:%d, Name:%s, Status:%s", result.ID, result.Name, result.Status)

	if t.DoneDate != nil && !t.DoneDate.IsZero() {
		result.DoneDate = t.DoneDate
	}

	if t.Error != nil && *t.Error != 0 {
		result.Error = fmt.Sprintf("Error code: %d", *t.Error)
		log.Printf("AddTorrent: Got Error code: %d", *t.Error)
	}

	if t.ErrorString != nil && *t.ErrorString != "" {
		result.ErrorString = *t.ErrorString
		log.Printf("AddTorrent: Got ErrorString: %s", result.ErrorString)
		// If there's an error string, this indicates the torrent addition failed
		return nil, fmt.Errorf("transmission error: %s", result.ErrorString)
	}

	// Additional validation - if we have an error code, that's also a failure
	if t.Error != nil && *t.Error != 0 {
		return nil, fmt.Errorf("transmission error code: %d", *t.Error)
	}

	log.Printf("AddTorrent: Returning successful result - ID:%d", result.ID)
	return result, nil
}

// StartTorrents starts the specified torrents
func (c *Client) StartTorrents(ctx context.Context, ids []int64) error {
	log.Printf("StartTorrents: Starting torrents with IDs: %v", ids)
	err := c.client.TorrentStartIDs(ctx, ids)
	if err != nil {
		log.Printf("StartTorrents: Failed to start torrents: %v", err)
		return fmt.Errorf("failed to start torrents: %w", err)
	}
	log.Printf("StartTorrents: Successfully started torrents: %v", ids)
	return nil
}

// StopTorrents stops the specified torrents
func (c *Client) StopTorrents(ctx context.Context, ids []int64) error {
	err := c.client.TorrentStopIDs(ctx, ids)
	if err != nil {
		return fmt.Errorf("failed to stop torrents: %w", err)
	}
	return nil
}

// RemoveTorrents removes the specified torrents
func (c *Client) RemoveTorrents(ctx context.Context, ids []int64, deleteLocalData bool) error {
	// Use the transmissionrpc library's TorrentRemove method
	payload := transmissionrpc.TorrentRemovePayload{
		IDs:             ids,
		DeleteLocalData: deleteLocalData,
	}

	fmt.Printf("Removing torrents with payload: %+v\n", payload)

	err := c.client.TorrentRemove(ctx, payload)
	if err != nil {
		return fmt.Errorf("failed to remove torrents: %w", err)
	}

	return nil
}

// GetSessionStats gets transmission session statistics
func (c *Client) GetSessionStats(ctx context.Context) (interface{}, error) {
	stats, err := c.client.SessionStats(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get session stats: %w", err)
	}
	return &stats, nil
}
