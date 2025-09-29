# User Preferences System

The Retorrent web UI includes a comprehensive user preference system that allows users to customize their experience across various aspects of the application.

## Features

- **Persistent Storage**: All preferences are automatically saved to localStorage and persist across browser sessions
- **Theme Integration**: Seamlessly integrates with the existing theme system
- **React Context**: Global preference state management accessible throughout the application
- **Type Safety**: Full TypeScript support with proper interfaces and type checking
- **Real-time Updates**: Changes are applied immediately and saved automatically

## Architecture

### PreferencesContext

The preference system is built around a React Context that provides:

```typescript
interface PreferencesContextType {
  preferences: UserPreferences;
  updatePreference: <K extends PreferenceKey>(key: K, value: UserPreferences[K]) => void;
  resetPreferences: () => void;
  isLoading: boolean;
}
```

### UserPreferences Interface

```typescript
export interface UserPreferences {
  // Theme preferences
  theme: 'light' | 'dark' | 'system';
  
  // UI preferences
  compactMode: boolean;
  showThumbnails: boolean;
  animationsEnabled: boolean;
  
  // Display preferences
  itemsPerPage: number;
  defaultView: 'list' | 'grid';
  showStatusBar: boolean;
  
  // Torrent preferences
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
  showCompletedTorrents: boolean;
  
  // Notification preferences
  showNotifications: boolean;
  notifyOnComplete: boolean;
  soundEnabled: boolean;
}
```

## Usage

### Setup

The PreferencesProvider is automatically included in the application setup in `main.tsx`:

```tsx
<AuthProvider>
  <PreferencesProvider>
    <ThemeProvider>
      <AppRouterProvider />
    </ThemeProvider>
  </PreferencesProvider>
</AuthProvider>
```

### Using Preferences in Components

```tsx
import { usePreferences } from '@shared/contexts/PreferencesContext';

function MyComponent() {
  const { preferences, updatePreference } = usePreferences();
  
  // Read preference values
  const isCompact = preferences.compactMode;
  const itemsPerPage = preferences.itemsPerPage;
  
  // Update preferences
  const handleToggleCompact = () => {
    updatePreference('compactMode', !preferences.compactMode);
  };
  
  const handleChangeItemsPerPage = (newValue: number) => {
    updatePreference('itemsPerPage', newValue);
  };
  
  return (
    <div>
      {/* Your component JSX */}
    </div>
  );
}
```

### Theme Synchronization

The preferences system automatically synchronizes with the existing theme system. When users change the theme preference, it updates both the PreferencesContext and ThemeContext simultaneously.

## Available Preferences

### Theme
- **theme**: Controls the application theme (light/dark/system)

### UI & Display
- **compactMode**: Reduces spacing and sizing for a more compact interface
- **showThumbnails**: Controls thumbnail display in lists
- **animationsEnabled**: Enables/disables UI animations
- **itemsPerPage**: Number of items to display per page (1-100)
- **defaultView**: Default view mode for torrent lists (list/grid)
- **showStatusBar**: Controls status bar visibility

### Torrent Management
- **autoRefresh**: Automatically refreshes torrent list
- **refreshInterval**: How often to refresh data (1-300 seconds)
- **showCompletedTorrents**: Whether to display completed torrents

### Notifications
- **showNotifications**: Master toggle for notifications
- **notifyOnComplete**: Notify when torrents complete
- **soundEnabled**: Enable notification sounds

## Storage

Preferences are stored in localStorage under the key `retorrent-preferences`. The system automatically:
- Loads preferences on application start
- Merges stored preferences with defaults to ensure all keys exist
- Saves preferences whenever they change
- Handles localStorage errors gracefully

## Default Values

The system includes sensible defaults for all preferences:

```typescript
export const defaultPreferences: UserPreferences = {
  theme: 'system',
  compactMode: false,
  showThumbnails: true,
  animationsEnabled: true,
  itemsPerPage: 20,
  defaultView: 'list',
  showStatusBar: true,
  autoRefresh: true,
  refreshInterval: 5,
  showCompletedTorrents: true,
  showNotifications: true,
  notifyOnComplete: true,
  soundEnabled: false,
};
```

## User Interface

Users can access preferences through the new "UI" tab in the Preferences page, which includes:
- Theme selection dropdown
- Checkboxes for boolean preferences
- Number inputs for numeric values
- Dropdown selects for enum values
- Save and Reset buttons
- Real-time preview of current settings

## Migration & Updates

When adding new preference options:
1. Update the `UserPreferences` interface
2. Add the new property to `defaultPreferences`
3. Update the UI components as needed
4. The system will automatically merge new defaults with existing user preferences