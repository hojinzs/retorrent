package transmission

import (
	"context"
)

// TransmissionClient defines the interface for both real and mock clients
type TransmissionClient interface {
	GetTorrents(ctx context.Context) ([]*TorrentData, error)
	AddTorrent(ctx context.Context, torrentData string, downloadDir *string) (*TorrentData, error)
	StartTorrents(ctx context.Context, ids []int64) error
	StopTorrents(ctx context.Context, ids []int64) error
	RemoveTorrents(ctx context.Context, ids []int64, deleteLocalData bool) error
	GetSessionStats(ctx context.Context) (interface{}, error)
}

// Ensure both Client and MockClient implement the interface
var _ TransmissionClient = (*Client)(nil)
var _ TransmissionClient = (*MockClient)(nil)
