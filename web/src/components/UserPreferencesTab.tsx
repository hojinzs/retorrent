import { Button } from '@shared/components/ui/button';
import { Label } from '@shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Separator } from '@shared/components/ui/separator';
import { Input } from '@shared/components/ui/input';
import { usePreferences } from '@shared/contexts/PreferencesContext';
import { useTheme } from '@shared/contexts/ThemeContext';
import { Save, RotateCcw } from 'lucide-react';

export function UserPreferencesTab() {
  const { preferences, updatePreference, resetPreferences } = usePreferences();
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    updatePreference('theme', newTheme);
    setTheme(newTheme);
  };

  const handleSavePreferences = () => {
    // Preferences are automatically saved via context, but we could add
    // additional logic here if needed (e.g., API calls)
    console.log('User preferences saved');
  };

  const handleResetPreferences = () => {
    resetPreferences();
    // Also reset theme to default
    setTheme('system');
  };

  return (
    <div className="space-y-6">
      {/* Theme Settings */}
      <div>
        <h3 className="mb-4">Theme</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Label className="w-32">Theme:</Label>
            <Select value={theme} onValueChange={handleThemeChange}>
              <SelectTrigger className="w-48 bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* UI Settings */}
      <div>
        <h3 className="mb-4">User Interface</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="compact-mode"
              checked={preferences.compactMode}
              onCheckedChange={(checked) => updatePreference('compactMode', !!checked)}
            />
            <Label htmlFor="compact-mode">Compact mode</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-thumbnails"
              checked={preferences.showThumbnails}
              onCheckedChange={(checked) => updatePreference('showThumbnails', !!checked)}
            />
            <Label htmlFor="show-thumbnails">Show thumbnails</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="animations-enabled"
              checked={preferences.animationsEnabled}
              onCheckedChange={(checked) => updatePreference('animationsEnabled', !!checked)}
            />
            <Label htmlFor="animations-enabled">Enable animations</Label>
          </div>
        </div>
      </div>

      <Separator />

      {/* Display Settings */}
      <div>
        <h3 className="mb-4">Display</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Label className="w-32">Items per page:</Label>
            <Input
              value={preferences.itemsPerPage.toString()}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value > 0) {
                  updatePreference('itemsPerPage', value);
                }
              }}
              className="w-24 bg-input border-border"
              type="number"
              min="1"
              max="100"
            />
          </div>

          <div className="flex items-center gap-4">
            <Label className="w-32">Default view:</Label>
            <Select
              value={preferences.defaultView}
              onValueChange={(value: 'list' | 'grid') => updatePreference('defaultView', value)}
            >
              <SelectTrigger className="w-48 bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="list">List</SelectItem>
                <SelectItem value="grid">Grid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-status-bar"
              checked={preferences.showStatusBar}
              onCheckedChange={(checked) => updatePreference('showStatusBar', !!checked)}
            />
            <Label htmlFor="show-status-bar">Show status bar</Label>
          </div>
        </div>
      </div>

      <Separator />

      {/* Torrent Settings */}
      <div>
        <h3 className="mb-4">Torrents</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto-refresh"
              checked={preferences.autoRefresh}
              onCheckedChange={(checked) => updatePreference('autoRefresh', !!checked)}
            />
            <Label htmlFor="auto-refresh">Auto-refresh torrent list</Label>
          </div>

          <div className="flex items-center gap-4">
            <Label className="w-32">Refresh interval:</Label>
            <Input
              value={preferences.refreshInterval.toString()}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value > 0) {
                  updatePreference('refreshInterval', value);
                }
              }}
              className="w-24 bg-input border-border"
              type="number"
              min="1"
              max="300"
            />
            <span className="text-sm text-muted-foreground">seconds</span>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-completed"
              checked={preferences.showCompletedTorrents}
              onCheckedChange={(checked) => updatePreference('showCompletedTorrents', !!checked)}
            />
            <Label htmlFor="show-completed">Show completed torrents</Label>
          </div>
        </div>
      </div>

      <Separator />

      {/* Notification Settings */}
      <div>
        <h3 className="mb-4">Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-notifications"
              checked={preferences.showNotifications}
              onCheckedChange={(checked) => updatePreference('showNotifications', !!checked)}
            />
            <Label htmlFor="show-notifications">Show notifications</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="notify-complete"
              checked={preferences.notifyOnComplete}
              onCheckedChange={(checked) => updatePreference('notifyOnComplete', !!checked)}
            />
            <Label htmlFor="notify-complete">Notify when torrent completes</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="sound-enabled"
              checked={preferences.soundEnabled}
              onCheckedChange={(checked) => updatePreference('soundEnabled', !!checked)}
            />
            <Label htmlFor="sound-enabled">Enable notification sounds</Label>
          </div>
        </div>
      </div>

      <Separator />

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        <Button
          size="sm"
          variant="outline"
          onClick={handleResetPreferences}
          className="border-border text-foreground hover:bg-accent/50"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to Defaults
        </Button>
        <Button
          size="sm"
          onClick={handleSavePreferences}
          className="bg-primary hover:bg-primary/90"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}