# Transmission WebUI Shaded

A modern, real-time web interface for Transmission BitTorrent client with PocketBase backend.

## Features

- **Real-time synchronization** with Transmission daemon (< 2s latency)
- **Modern React UI** with real-time status updates
- **PocketBase backend** for authentication and data persistence
- **WebSocket-based real-time updates** for instant UI reflection
- **Torrent management** (start, stop, remove operations)
- **Responsive design** for desktop and mobile devices

## Architecture

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Go + PocketBase + Transmission RPC
- **Real-time**: PocketBase WebSocket subscriptions
- **Sync**: Background polling every 5 seconds

## Quick Start

### Prerequisites

- Go 1.21+
- Node.js 18+
- Running Transmission daemon

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/hojinzs/transmission-webui-shaded.git
   cd transmission-webui-shaded
   ```

2. **Setup the server**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your Transmission settings
   go mod download
   go run . serve --dev
   ```

3. **Setup the web frontend**
   ```bash
   cd web
   cp .env.example .env.local
   # Edit .env.local if needed
   npm install
   npm run dev
   ```

4. **Access the application**
   - Web UI: http://localhost:5173
   - PocketBase Admin: http://localhost:8080/_/

### Production Deployment

1. **Build the web app**
   ```bash
   cd web
   npm run build
   ```

2. **Copy built files to server**
   ```bash
   cp -r dist/* ../server/pb_public/
   ```

3. **Build and run the server**
   ```bash
   cd server
   go build -o bin/server .
   ./bin/server serve --http=0.0.0.0:8080
   ```

## Environment Variables

### Server (.env)
```bash
TRANSMISSION_HOST=http://localhost:9091/transmission/rpc
TRANSMISSION_USER=your_username
TRANSMISSION_PASS=your_password
```

### Web (.env.local)
```bash
VITE_POCKETBASE_URL=http://localhost:8080
```

## Docker Deployment

```yaml
version: '3.8'
services:
  transmission-webui:
    build: .
    ports:
      - "8080:8080"
    environment:
      - TRANSMISSION_HOST=http://transmission:9091/transmission/rpc
      - TRANSMISSION_USER=
      - TRANSMISSION_PASS=
    volumes:
      - pb_data:/app/pb_data
    depends_on:
      - transmission

  transmission:
    image: ghcr.io/linuxserver/transmission
    ports:
      - "9091:9091"
    volumes:
      - transmission_data:/downloads
    environment:
      - PUID=1000
      - PGID=1000

volumes:
  pb_data:
  transmission_data:
```

## API Endpoints

- `GET /api/torrents` - List all torrents (via PocketBase)
- `POST /api/torrents/sync` - Force sync with Transmission
- `POST /api/torrents/:id/action` - Control torrent (start/stop/remove)

## Real-time Features

The application provides real-time updates through:

1. **Server-side polling**: Fetches torrent data from Transmission every 5 seconds
2. **PocketBase real-time**: Pushes changes to connected clients via WebSocket
3. **Client-side subscription**: React components automatically update on data changes

## Development

### Server Development
```bash
cd server
go run . serve --dev
```

### Web Development
```bash
cd web
npm run dev
```

### Building
```bash
# Build server
cd server && go build -o bin/server .

# Build web
cd web && npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.