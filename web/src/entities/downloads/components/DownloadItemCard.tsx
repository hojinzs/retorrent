import { Button } from "@shared/components/ui/button"
import { Checkbox } from "@shared/components/ui/checkbox"
import { Progress } from "@shared/components/ui/progress"
import { Pause, Play, Trash2 } from "lucide-react"
import { cn } from "@shared/lib/utils"
import type { Torrent, TorrentStatus } from "../model"

interface DownloadItemCardProps {
  torrent: Torrent
  onControl?: (id: string, action: 'start' | 'stop' | 'remove') => void
  isSelected?: boolean
  onSelectionChange?: (selected: boolean) => void
  showSelection?: boolean
}

export function DownloadItemCard({
  torrent,
  onControl,
  isSelected = false,
  onSelectionChange,
  showSelection = false
}: DownloadItemCardProps) {
  const progressPercent = torrent.percentDone * 100
  const sizeText = formatBytes(torrent.sizeWhenDone)
  const isActive = torrent.status === 'download' || torrent.status === 'seed'
  const etaText = formatEta(torrent.eta)
  const downloadSpeed = torrent.rateDownload > 0 ? `${formatBytes(torrent.rateDownload)}/s` : '0 B/s'
  const uploadSpeed = torrent.rateUpload > 0 ? `${formatBytes(torrent.rateUpload)}/s` : '0 B/s'

  const handleAction = (action: 'start' | 'stop' | 'remove') => {
    onControl?.(torrent.id, action)
  }

  return (
    <div
      className={cn(
        'px-6 py-4 transition-colors border-b border-white/20 dark:border-white/10 last:border-b-0',
        isSelected
          ? 'bg-emerald-700/10 dark:bg-emerald-600/20'
          : 'hover:bg-white/60 dark:hover:bg-slate-900/40'
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex flex-1 items-start gap-3 min-w-0">
            {showSelection && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelectionChange}
                aria-label={`Select ${torrent.name}`}
                className="mt-1"
              />
            )}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <p className="caption flex-1 truncate font-medium text-slate-900 dark:text-white">
                  {torrent.name}
                </p>
                <StatusBadge status={torrent.status} />
                <span className="detail text-muted-foreground">{sizeText}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Progress
                    value={progressPercent}
                    className="h-1.5 bg-emerald-700/20"
                    indicatorClassName="bg-emerald-600"
                  />
                </div>
                <span className="detail text-muted-foreground shrink-0">
                  {Math.round(progressPercent)}%
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isActive ? (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl hover:bg-emerald-600/10"
                onClick={() => handleAction('stop')}
                aria-label={`Pause ${torrent.name}`}
              >
                <Pause className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl hover:bg-emerald-600/10"
                onClick={() => handleAction('start')}
                aria-label={`Resume ${torrent.name}`}
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
            {!showSelection && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl hover:bg-red-500/10"
                onClick={() => handleAction('remove')}
                aria-label={`Remove ${torrent.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-muted-foreground detail">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>↓ {downloadSpeed}</span>
            <span>↑ {uploadSpeed}</span>
            <span>Ratio {torrent.uploadRatio.toFixed(2)}</span>
          </div>
          <span>ETA {etaText}</span>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: TorrentStatus }) {
  const textMap: Record<TorrentStatus, string> = {
    stopped: 'Stopped',
    checkWait: 'Check Wait',
    check: 'Checking',
    downloadWait: 'Download Wait',
    download: 'Downloading',
    seedWait: 'Seed Wait',
    seed: 'Seeding',
    removed: 'Removed',
  }

  const styleMap: Record<TorrentStatus, string> = {
    stopped: 'bg-slate-200/70 text-slate-700 dark:bg-slate-800/70 dark:text-slate-200',
    checkWait: 'bg-amber-200/70 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
    check: 'bg-amber-200/70 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
    downloadWait: 'bg-amber-200/70 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
    download: 'bg-emerald-600/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
    seedWait: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
    seed: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
    removed: 'bg-red-500/20 text-red-700 dark:bg-red-500/25 dark:text-red-200',
  }

  return (
    <span
      className={cn(
        'rounded-full px-3 py-1 text-xs font-medium tracking-tight backdrop-blur-sm',
        styleMap[status]
      )}
    >
      {textMap[status]}
    </span>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatEta(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '∞'
  const totalSeconds = Math.floor(seconds)
  if (totalSeconds === 0) return '∞'
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`
  }
  return `${secs}s`
}
