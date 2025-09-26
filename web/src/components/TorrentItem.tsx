import { Progress } from "@shared/components/ui/progress";
import { Button } from "@shared/components/ui/button";
import { Pause, Play, Trash2 } from "lucide-react";

export interface TorrentData {
  id: string;
  name: string;
  progress: number;
  downloadSpeed: string;
  uploadSpeed: string;
  size: string;
  status: 'downloading' | 'seeding' | 'paused' | 'completed';
  eta: string;
}

interface TorrentItemProps {
  torrent: TorrentData;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onRemove: (id: string) => void;
}

export function TorrentItem({ torrent, onPause, onResume, onRemove }: TorrentItemProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'downloading': return 'text-primary';
      case 'seeding': return 'text-green-500';
      case 'paused': return 'text-muted-foreground';
      case 'completed': return 'text-green-600';
      default: return 'text-foreground';
    }
  };

  return (
    <div className="px-4 py-3 border-b border-border hover:bg-accent/50 transition-colors">
      {/* First row: filename, status, size */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="caption truncate flex-1 min-w-0">{torrent.name}</span>
          <span className={`detail ${getStatusColor(torrent.status)} shrink-0`}>
            {torrent.status.charAt(0).toUpperCase() + torrent.status.slice(1)}
          </span>
          <span className="detail text-muted-foreground shrink-0">{torrent.size}</span>
        </div>
      </div>
      
      {/* Second row: progress bar with actions */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1">
          <Progress value={torrent.progress} className="h-1.5" />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {torrent.status === 'paused' ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => onResume(torrent.id)}
            >
              <Play className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => onPause(torrent.id)}
            >
              <Pause className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => onRemove(torrent.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      
      {/* Third row: speeds and progress info */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <span className="detail text-muted-foreground">
            ↓ {torrent.downloadSpeed}
          </span>
          <span className="detail text-muted-foreground">
            ↑ {torrent.uploadSpeed}
          </span>
        </div>
        <span className="detail text-muted-foreground">
          {torrent.progress}% • {torrent.eta}
        </span>
      </div>
    </div>
  );
}