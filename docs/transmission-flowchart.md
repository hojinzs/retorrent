# Transmission → Backend → Client Flow

The diagram below captures how torrent data and commands travel between the Transmission daemon, the Go backend, and the React client.

```mermaid
flowchart TD
  subgraph Client
    A[React UI
useTorrents hook]
  end
  subgraph Backend
    B[PocketBase REST & Realtime]
    C[Custom API Routes
/api/torrents/*]
    D[Torrent Service]
    E[Sync Service]
  end
  subgraph Transmission
    F[Transmission Client
(hekmon/transmissionrpc)]
    G[Transmission Daemon]
  end

  A -->|Load torrent list| B
  B -->|Realtime subscription events| A

  A -->|POST add / action / remove| C
  C --> D --> F -->|RPC commands| G
  G -->|RPC responses| F --> D

  D -->|Force sync| E
  E -->|Update torrent records| B
  E -->|Realtime change events| A
```

## Flow description

1. The React hook loads torrent data from PocketBase and subscribes to realtime updates, so UI state reflects collection changes automatically.【F:web/src/entities/downloads/hooks/useTorrents.ts†L12-L68】
2. User actions (add, control, remove, sync) call the backend's `/api/torrents/*` routes, which delegate to the torrent service for business logic.【F:web/src/entities/downloads/hooks/useTorrents.ts†L70-L151】【F:server/routes/torrent.go†L20-L85】
3. The torrent service issues RPC requests through the Transmission client (built on `hekmon/transmissionrpc`) to add, start, stop, or remove torrents, and then triggers a sync to keep PocketBase in step.【F:server/internal/torrent/service.go†L13-L168】【F:server/internal/transmission/client.go†L64-L358】
4. The sync service polls Transmission, then upserts/deletes records in PocketBase; realtime events propagate back to the subscribed React client so the UI updates without extra polling.【F:server/internal/transmission/sync.go†L13-L200】
