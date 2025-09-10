package transmission

import (
	"context"
	"fmt"
	"net/url"
	"time"

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
	ID               int64         `json:"id"`
	Name             string        `json:"name"`
	HashString       string        `json:"hashString"`
	Status           TorrentStatus `json:"status"`
	PercentDone      float64       `json:"percentDone"`
	SizeWhenDone     int64         `json:"sizeWhenDone"`
	RateDownload     int64         `json:"rateDownload"`
	RateUpload       int64         `json:"rateUpload"`
	UploadRatio      float64       `json:"uploadRatio"`
	ETA              int64         `json:"eta"`
	TotalSize        int64         `json:"totalSize"`
	DownloadedEver   int64         `json:"downloadedEver"`
	UploadedEver     int64         `json:"uploadedEver"`
	AddedDate        time.Time     `json:"addedDate"`
	DoneDate         *time.Time    `json:"doneDate,omitempty"`
	Error            string        `json:"error,omitempty"`
	ErrorString      string        `json:"errorString,omitempty"`
}

// Client wraps the Transmission RPC client
type Client struct {
	client *transmissionrpc.Client
	app    core.App
}

// NewClient creates a new Transmission client
func NewClient(app core.App, endpoint, username, password string) (*Client, error) {
	u, err := url.Parse(endpoint)
	if err != nil {
		return nil, fmt.Errorf("invalid transmission endpoint: %w", err)
	}

	client, err := transmissionrpc.New(u, nil)
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
		torrentData := &TorrentData{
			ID:               int64(*t.ID),
			Name:             *t.Name,
			HashString:       *t.HashString,
			Status:           mapTransmissionStatus(*t.Status),
			PercentDone:      *t.PercentDone,
			SizeWhenDone:     int64(*t.SizeWhenDone),
			RateDownload:     *t.RateDownload,
			RateUpload:       *t.RateUpload,
			UploadRatio:      *t.UploadRatio,
			ETA:              int64(*t.ETA),
			TotalSize:        int64(*t.TotalSize),
			DownloadedEver:   *t.DownloadedEver,
			UploadedEver:     *t.UploadedEver,
			AddedDate:        *t.AddedDate,
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

// AddTorrent adds a new torrent by magnet link or file
func (c *Client) AddTorrent(ctx context.Context, torrentData string, downloadDir *string) (*TorrentData, error) {
	// For now, return a simple placeholder
	// TODO: Implement proper torrent adding
	return nil, fmt.Errorf("torrent adding not implemented yet")
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
	// For now, return a simple placeholder
	// TODO: Implement proper torrent removal 
	return fmt.Errorf("torrent removal not implemented yet")
}

// GetSessionStats gets transmission session statistics
func (c *Client) GetSessionStats(ctx context.Context) (interface{}, error) {
	stats, err := c.client.SessionStats(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get session stats: %w", err)
	}
	return &stats, nil
}