import { Badge } from "@shared/components/ui/badge"
import { Button } from "@shared/components/ui/button"
import { Card } from "@shared/components/ui/card"
import { Progress } from "@shared/components/ui/progress"
import type {Torrent, TorrentStatus} from "../model"

interface DownloadItemCardProps {
  torrent: Torrent
  onControl?: (transmissionId: number, action: 'start' | 'stop' | 'remove') => void
}

export function DownloadItemCard({ torrent, onControl }: DownloadItemCardProps) {
  const progressPercent = torrent.percentDone * 100
  const sizeText = formatBytes(torrent.sizeWhenDone)
  const isActive = torrent.status === 'download' || torrent.status === 'seed'
  
  const handleAction = (action: 'start' | 'stop' | 'remove') => {
    onControl?.(torrent.transmissionId, action)
  }

  return (
    <Card>
      <div className="flex items-center justify-between p-3 pr-4">
        <div className="flex flex-1 items-center gap-4">
          <div className="flex-1">
            <div className="font-semibold">{torrent.name}</div>
            <div className="mt-1.5 flex items-center gap-2">
              <StatusBadge status={torrent.status} />
              <div className="text-xs text-muted-foreground">
                {Math.round(progressPercent)}% • {sizeText} • ratio {torrent.uploadRatio.toFixed(2)}
              </div>
              {torrent.rateDownload > 0 && (
                <div className="text-xs text-green-600">
                  ↓ {formatBytes(torrent.rateDownload)}/s
                </div>
              )}
              {torrent.rateUpload > 0 && (
                <div className="text-xs text-blue-600">
                  ↑ {formatBytes(torrent.rateUpload)}/s
                </div>
              )}
            </div>
            <Progress value={progressPercent} className="mt-2 h-1.5 max-w-xs" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isActive ? (
            <Button variant="outline" size="sm" onClick={() => handleAction('stop')}>
              Pause
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => handleAction('start')}>
              Start
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={() => handleAction('remove')}>
            Remove
          </Button>
        </div>
      </div>
    </Card>
  )
}

function StatusBadge({ status }: { status: TorrentStatus }) {
  const variantMap: Record<TorrentStatus, "default" | "destructive" | "secondary" | "outline"> = {
    stopped: 'outline',
    checkWait: 'secondary',
    check: 'default',
    downloadWait: 'secondary',
    download: 'default',
    seedWait: 'secondary',
    seed: 'secondary',
    removed: 'destructive',
  };

  const textMap: Record<TorrentStatus, string> = {
    stopped: 'Stopped',
    checkWait: 'Check Wait',
    check: 'Checking',
    downloadWait: 'Download Wait',
    download: 'Downloading',
    seedWait: 'Seed Wait',
    seed: 'Seeding',
    removed: 'Removed',
  };

  return (
    <Badge variant={variantMap[status]}>{textMap[status]}</Badge>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
