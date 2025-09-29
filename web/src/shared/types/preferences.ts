export interface UserPreferences {
  // Theme preferences (leveraging existing theme system)
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

export const defaultPreferences: UserPreferences = {
  // Theme
  theme: 'system',
  
  // UI
  compactMode: false,
  showThumbnails: true,
  animationsEnabled: true,
  
  // Display
  itemsPerPage: 20,
  defaultView: 'list',
  showStatusBar: true,
  
  // Torrent
  autoRefresh: true,
  refreshInterval: 5,
  showCompletedTorrents: true,
  
  // Notifications
  showNotifications: true,
  notifyOnComplete: true,
  soundEnabled: false,
};

export type PreferenceKey = keyof UserPreferences;