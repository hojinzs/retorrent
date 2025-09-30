# Preferences API

This document describes the Preferences API implementation for managing Transmission settings.

## Backend API

### GET /api/preferences

Retrieves current Transmission session settings.

**Response:**
```json
{
  "success": true,
  "data": {
    "download-dir": "/downloads/complete",
    "incomplete-dir": "/downloads/incomplete",
    "incomplete-dir-enabled": true,
    "start-added-torrents": true,
    "peer-port": 51413,
    "peer-port-random-on-start": false,
    "port-forwarding-enabled": true,
    "speed-limit-down": 0,
    "speed-limit-down-enabled": false,
    "speed-limit-up": 0,
    "speed-limit-up-enabled": false,
    "alt-speed-down": 50,
    "alt-speed-up": 50,
    "peer-limit-global": 200,
    "peer-limit-per-torrent": 50,
    "encryption": "prefer",
    "pex-enabled": true,
    "dht-enabled": true,
    "lpd-enabled": false,
    "seedRatioLimit": 2.0,
    "seedRatioLimited": true,
    "idle-seeding-limit": 30,
    "idle-seeding-limit-enabled": false,
    "rename-partial-files": false
  }
}
```

### POST /api/preferences

Updates Transmission session settings.

**Request:**
```json
{
  "settings": {
    "download-dir": "/downloads/new-path",
    "peer-port": 8080,
    "encryption": "required"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Preferences updated successfully"
}
```

## Frontend Usage

### Hooks

#### usePreferences()

Hook for fetching preferences data with TanStack Query.

```typescript
import { usePreferences } from '@shared/api/preferences';

function PreferencesComponent() {
  const { data, isLoading, error, refetch } = usePreferences();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <p>Download dir: {data?.data['download-dir']}</p>
    </div>
  );
}
```

#### useUpdatePreferences()

Hook for updating preferences with optimistic updates.

```typescript
import { useUpdatePreferences } from '@shared/api/preferences';

function PreferencesForm() {
  const updatePreferences = useUpdatePreferences();
  
  const handleSave = async () => {
    try {
      await updatePreferences.mutateAsync({
        'download-dir': '/new/path',
        'peer-port': 9091
      });
      console.log('Settings saved!');
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };
  
  return (
    <button 
      onClick={handleSave}
      disabled={updatePreferences.isPending}
    >
      {updatePreferences.isPending ? 'Saving...' : 'Save'}
    </button>
  );
}
```

### Types

```typescript
interface SessionSettings {
  'download-dir'?: string;
  'incomplete-dir'?: string;
  'incomplete-dir-enabled'?: boolean;
  'start-added-torrents'?: boolean;
  'peer-port'?: number;
  'peer-port-random-on-start'?: boolean;
  'port-forwarding-enabled'?: boolean;
  'speed-limit-down'?: number;
  'speed-limit-down-enabled'?: boolean;
  'speed-limit-up'?: number;
  'speed-limit-up-enabled'?: boolean;
  'alt-speed-down'?: number;
  'alt-speed-up'?: number;
  'peer-limit-global'?: number;
  'peer-limit-per-torrent'?: number;
  encryption?: string;
  'pex-enabled'?: boolean;
  'dht-enabled'?: boolean;
  'lpd-enabled'?: boolean;
  seedRatioLimit?: number;
  seedRatioLimited?: boolean;
  'idle-seeding-limit'?: number;
  'idle-seeding-limit-enabled'?: boolean;
  'rename-partial-files'?: boolean;
}
```

## Implementation Details

### Backend Architecture

- **TransmissionClient Interface**: Extended with `GetSessionSettings()` and `SetSessionSettings()` methods
- **Mock Support**: MockClient provides realistic demo data for development
- **Real Integration**: Uses Transmission RPC `SessionArgumentsGetAll()` and `SessionArgumentsSet()` 
- **Route Registration**: Preference routes are registered in `main.go`

### Frontend Architecture

- **TanStack Query**: Provides caching, error handling, and optimistic updates
- **Type Safety**: Full TypeScript support for all session settings
- **Change Tracking**: UI tracks form modifications to enable/disable save button
- **Error Handling**: Proper loading and error states for better UX

### Demo Mode

When Transmission is not available, the system automatically falls back to mock data:

```go
// Mock data example
{
  "download-dir": "/downloads/complete",
  "peer-port": 51413,
  "encryption": "prefer",
  // ... other settings
}
```

This allows for development and testing without requiring a real Transmission instance.