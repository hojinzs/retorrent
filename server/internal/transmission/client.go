package transmission

import (
	"context"
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
	// Create TorrentAddPayload
	payload := transmissionrpc.TorrentAddPayload{
		DownloadDir: downloadDir,
	}

	// Check if it's a magnet link or base64 torrent data
	if strings.HasPrefix(torrentData, "magnet:") {
		payload.Filename = &torrentData
	} else {
		// Assume it's base64 encoded torrent file data
		payload.MetaInfo = &torrentData
	}

	// Add the torrent
	t, err := c.client.TorrentAdd(ctx, payload)
	if err != nil {
		return nil, fmt.Errorf("failed to add torrent: %w", err)
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

	if t.DoneDate != nil && !t.DoneDate.IsZero() {
		result.DoneDate = t.DoneDate
	}

	if t.Error != nil && *t.Error != 0 {
		result.Error = fmt.Sprintf("Error code: %d", *t.Error)
	}

	if t.ErrorString != nil && *t.ErrorString != "" {
		result.ErrorString = *t.ErrorString
	}

	return result, nil
}

// StartTorrents starts the specified torrents
func (c *Client) StartTorrents(ctx context.Context, ids []int64) error {
	err := c.client.TorrentStartIDs(ctx, ids)
	if err != nil {
		return fmt.Errorf("failed to start torrents: %w", err)
	}
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

// GetSessionSettings gets transmission session settings
func (c *Client) GetSessionSettings(ctx context.Context) (interface{}, error) {
	session, err := c.client.SessionArgumentsGetAll(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get session settings: %w", err)
	}
	return &session, nil
}

// SetSessionSettings updates transmission session settings
func (c *Client) SetSessionSettings(ctx context.Context, settings map[string]interface{}) error {
	// Create a SessionArguments payload from the provided settings
	payload := transmissionrpc.SessionArguments{}
	
	// Map common settings with proper type conversion
	for key, value := range settings {
		switch key {
		case "download-dir":
			if str, ok := value.(string); ok {
				payload.DownloadDir = &str
			}
		case "incomplete-dir":
			if str, ok := value.(string); ok {
				payload.IncompleteDir = &str
			}
		case "incomplete-dir-enabled":
			if b, ok := value.(bool); ok {
				payload.IncompleteDirEnabled = &b
			}
		case "start-added-torrents":
			if b, ok := value.(bool); ok {
				payload.StartAddedTorrents = &b
			}
		case "peer-port":
			if f, ok := value.(float64); ok {
				port := int64(f)
				payload.PeerPort = &port
			}
		case "peer-port-random-on-start":
			if b, ok := value.(bool); ok {
				payload.PeerPortRandomOnStart = &b
			}
		case "port-forwarding-enabled":
			if b, ok := value.(bool); ok {
				payload.PortForwardingEnabled = &b
			}
		case "speed-limit-down":
			if f, ok := value.(float64); ok {
				limit := int64(f)
				payload.SpeedLimitDown = &limit
			}
		case "speed-limit-down-enabled":
			if b, ok := value.(bool); ok {
				payload.SpeedLimitDownEnabled = &b
			}
		case "speed-limit-up":
			if f, ok := value.(float64); ok {
				limit := int64(f)
				payload.SpeedLimitUp = &limit
			}
		case "speed-limit-up-enabled":
			if b, ok := value.(bool); ok {
				payload.SpeedLimitUpEnabled = &b
			}
		case "alt-speed-down":
			if f, ok := value.(float64); ok {
				limit := int64(f)
				payload.AltSpeedDown = &limit
			}
		case "alt-speed-up":
			if f, ok := value.(float64); ok {
				limit := int64(f)
				payload.AltSpeedUp = &limit
			}
		case "peer-limit-global":
			if f, ok := value.(float64); ok {
				limit := int64(f)
				payload.PeerLimitGlobal = &limit
			}
		case "peer-limit-per-torrent":
			if f, ok := value.(float64); ok {
				limit := int64(f)
				payload.PeerLimitPerTorrent = &limit
			}
		case "encryption":
			if str, ok := value.(string); ok {
				enc := transmissionrpc.Encryption(str)
				payload.Encryption = &enc
			}
		case "pex-enabled":
			if b, ok := value.(bool); ok {
				payload.PEXEnabled = &b
			}
		case "dht-enabled":
			if b, ok := value.(bool); ok {
				payload.DHTEnabled = &b
			}
		case "lpd-enabled":
			if b, ok := value.(bool); ok {
				payload.LPDEnabled = &b
			}
		case "seedRatioLimit":
			if f, ok := value.(float64); ok {
				payload.SeedRatioLimit = &f
			}
		case "seedRatioLimited":
			if b, ok := value.(bool); ok {
				payload.SeedRatioLimited = &b
			}
		case "idle-seeding-limit":
			if f, ok := value.(float64); ok {
				limit := int64(f)
				payload.IdleSeedingLimit = &limit
			}
		case "idle-seeding-limit-enabled":
			if b, ok := value.(bool); ok {
				payload.IdleSeedingLimitEnabled = &b
			}
		case "queue-stalled-minutes":
			if f, ok := value.(float64); ok {
				limit := int64(f)
				payload.QueueStalledMinutes = &limit
			}
		case "rename-partial-files":
			if b, ok := value.(bool); ok {
				payload.RenamePartialFiles = &b
			}
		}
	}
	
	err := c.client.SessionArgumentsSet(ctx, payload)
	if err != nil {
		return fmt.Errorf("failed to set session settings: %w", err)
	}
	
	return nil
}
