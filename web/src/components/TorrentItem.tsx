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
  isMobile: boolean;
}

export function TorrentItem({ torrent, onAction, isMobile }: TorrentItemProps) {
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
    <div className="py-4 hover:bg-accent/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-4">
          <h3 className="font-medium text-foreground truncate mb-1">{torrent.name}</h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className={getStatusColor(torrent.status)}>
              {torrent.status.charAt(0).toUpperCase() + torrent.status.slice(1)}
            </span>
            <span>{torrent.size}</span>
            <span>{torrent.progress}%</span>
            <span>ETA: {torrent.eta}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {torrent.status === 'paused' ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-accent/50"
              onClick={() => onAction(torrent.id, 'play')}
            >
              <Play className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-accent/50"
              onClick={() => onAction(torrent.id, 'pause')}
            >
              <Pause className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-accent/50 text-destructive hover:text-destructive"
            onClick={() => onAction(torrent.id, 'remove')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="mb-3">
        <Progress 
          value={torrent.progress} 
          className="h-2"
          style={{
            '--progress-background': '#16a34a',
          } as React.CSSProperties}
        />
      </div>
      
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <div className="flex gap-4">
          <span>↓ {torrent.downloadSpeed}</span>
          <span>↑ {torrent.uploadSpeed}</span>
        </div>
      </div>
    </div>
  );
}