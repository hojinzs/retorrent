import React from "react";
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
  onAction: (id: string, action: 'play' | 'pause' | 'remove') => void;
}

export function TorrentItem({ torrent, onAction }: TorrentItemProps) {
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
    <div className="py-3 hover:bg-accent/30 transition-colors border-b border-border/50 last:border-b-0">
      {/* Line 1: Title, Status, Total Size */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 min-w-0 pr-4">
          <h3 className="font-medium text-foreground truncate text-sm">{torrent.name}</h3>
        </div>
        <div className="flex items-center gap-4 text-sm shrink-0">
          <span className={`${getStatusColor(torrent.status)} font-medium`}>
            {torrent.status.charAt(0).toUpperCase() + torrent.status.slice(1)}
          </span>
          <span className="text-muted-foreground font-medium">{torrent.size}</span>
        </div>
      </div>
      
      {/* Line 2: Progress Bar, Percentage, Actions */}
      <div className="flex items-center gap-4 mb-2">
        <div className="flex-1">
          <Progress 
            value={torrent.progress} 
            className="h-2"
            style={{
              '--progress-background': '#16a34a',
            } as React.CSSProperties}
          />
        </div>
        <span className="text-sm font-medium text-muted-foreground w-12 text-right">{torrent.progress}%</span>
        <div className="flex items-center gap-1 shrink-0">
          {torrent.status === 'paused' ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 hover:bg-accent/50"
              onClick={() => onAction(torrent.id, 'play')}
            >
              <Play className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 hover:bg-accent/50"
              onClick={() => onAction(torrent.id, 'pause')}
            >
              <Pause className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 hover:bg-accent/50 text-destructive hover:text-destructive"
            onClick={() => onAction(torrent.id, 'remove')}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      
      {/* Line 3: Upload/Download Speed, Ratio, Remaining Time (smaller font) */}
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <div className="flex gap-4">
          <span>↓ {torrent.downloadSpeed}</span>
          <span>↑ {torrent.uploadSpeed}</span>
          <span>Ratio: 0.0</span>
        </div>
        <span>ETA: {torrent.eta}</span>
      </div>
    </div>
  );
}