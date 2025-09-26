import { useState, useCallback } from "react"
import { Button } from "@shared/components/ui/button"
import { Badge } from "@shared/components/ui/badge"
import { Checkbox } from "@shared/components/ui/checkbox"
import { useTorrents } from "../entities/downloads/hooks/useTorrents"
import { DownloadItemCard } from "../entities/downloads/components/DownloadItemCard"
import { TorrentAddDialog } from "../entities/downloads/components/TorrentAddDialog"
import { TorrentRemoveDialog } from "../entities/downloads/components/TorrentRemoveDialog"
import { RefreshCw, Wifi, WifiOff, Trash2, CheckSquare, Square } from "lucide-react"

export function DownloadsPage() {
  const { torrents, isLoading, error, forceSync, controlTorrent, addTorrent, removeTorrents } = useTorrents()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [showSelection, setShowSelection] = useState(false)
  const [removeTargets, setRemoveTargets] = useState<typeof torrents>([])

  const selectedTorrents = torrents.filter(t => selectedIds.has(t.id))
  const allSelected = torrents.length > 0 && selectedIds.size === torrents.length
  const someSelected = selectedIds.size > 0

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(torrents.map(t => t.id)))
    }
  }, [allSelected, torrents])

  const handleSelectTorrent = useCallback((torrentId: string, selected: boolean) => {
    const newSelected = new Set(selectedIds)
    if (selected) {
      newSelected.add(torrentId)
    } else {
      newSelected.delete(torrentId)
    }
    setSelectedIds(newSelected)
  }, [selectedIds])

  const handleRemoveSelected = useCallback(() => {
    if (selectedTorrents.length > 0) {
      setRemoveTargets(selectedTorrents)
      setShowRemoveDialog(true)
    }
  }, [selectedTorrents])

  const handleRemoveConfirm = useCallback(async (ids: number[], deleteLocalData: boolean) => {
    await removeTorrents(ids, deleteLocalData)
    setSelectedIds(new Set())
    setRemoveTargets([])
    setShowRemoveDialog(false)
  }, [removeTorrents])

  const toggleSelectionMode = useCallback(() => {
    setShowSelection(!showSelection)
    if (showSelection) {
      setSelectedIds(new Set())
    }
  }, [showSelection])

  const handleControl = useCallback(async (id: string, action: 'start' | 'stop' | 'remove') => {
    if (action === 'remove') {
      const target = torrents.find(t => t.id === id)
      if (target) {
        setRemoveTargets([target])
        setShowRemoveDialog(true)
      }
      return
    }
    await controlTorrent(id, action)
  }, [torrents, controlTorrent])

  const renderEmptyState = () => (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-700/10 text-emerald-700 dark:text-emerald-300">
        <Wifi className="h-8 w-8" />
      </div>
      <h3 className="mt-6 text-xl font-semibold text-slate-800 dark:text-white">No torrents found</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Add a torrent or sync with Transmission to get started.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <TorrentAddDialog
          onAddTorrent={addTorrent}
          triggerProps={{ className: 'rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg shadow-emerald-700/25' }}
        />
        <Button
          onClick={forceSync}
          variant="ghost"
          className="rounded-xl border border-white/40 bg-white/40 px-4 py-2 text-sm hover:bg-white/60 dark:border-white/10 dark:bg-slate-900/40 dark:hover:bg-slate-900/60"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Check for torrents
        </Button>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <div className="backdrop-blur-glass glass-panel rounded-3xl border border-white/30 px-10 py-14 text-center shadow-xl dark:border-white/10">
          <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-muted-foreground">Loading torrents…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <div className="backdrop-blur-glass glass-panel max-w-md rounded-3xl border border-white/30 px-8 py-10 text-center shadow-xl dark:border-white/10">
          <WifiOff className="mx-auto mb-4 h-10 w-10 text-red-500" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Connection issue</h3>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button onClick={forceSync} className="mt-6 rounded-xl bg-emerald-700 text-white hover:bg-emerald-600">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-slate-800 dark:text-white">Downloads</h2>
          <p className="caption text-muted-foreground">Real-time overview of your Transmission torrents.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-emerald-700 shadow-sm dark:bg-slate-900/60 dark:text-emerald-300">
            <Wifi className="h-3.5 w-3.5" />
            Live sync
          </Badge>
          <Button
            onClick={forceSync}
            variant="ghost"
            className="rounded-xl border border-white/30 bg-white/40 px-4 py-2 text-sm hover:bg-white/60 dark:border-white/10 dark:bg-slate-900/50 dark:hover:bg-slate-900/70"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync now
          </Button>
          <TorrentAddDialog
            onAddTorrent={addTorrent}
            triggerProps={{ className: 'rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg shadow-emerald-700/25' }}
          />
        </div>
      </div>

      <div className="backdrop-blur-glass glass-panel overflow-hidden rounded-3xl border border-white/30 shadow-[0_40px_120px_-45px_rgba(15,23,42,0.45)] dark:border-white/10">
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/20 px-6 py-4 dark:border-white/10">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl bg-white/50 px-3 py-2 text-sm hover:bg-white/70 dark:bg-slate-900/60 dark:hover:bg-slate-900/80"
                onClick={toggleSelectionMode}
              >
                {showSelection ? <Square className="mr-2 h-4 w-4" /> : <CheckSquare className="mr-2 h-4 w-4" />}
                {showSelection ? 'Cancel selection' : 'Select torrents'}
              </Button>
              {showSelection && (
                <div className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/60 px-3 py-1.5 text-xs dark:border-white/10 dark:bg-slate-900/50">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all torrents"
                  />
                  <span className="text-muted-foreground">
                    {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
                  </span>
                </div>
              )}
            </div>

            {showSelection && someSelected && (
              <Button
                variant="destructive"
                size="sm"
                className="rounded-xl px-4 py-2 text-sm"
                onClick={handleRemoveSelected}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove selected ({selectedIds.size})
              </Button>
            )}
          </div>

          {torrents.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="divide-y divide-white/15 dark:divide-white/10">
              {torrents.map((torrent) => (
                <DownloadItemCard
                  key={torrent.id}
                  torrent={torrent}
                  onControl={handleControl}
                  isSelected={selectedIds.has(torrent.id)}
                  onSelectionChange={(selected) => handleSelectTorrent(torrent.id, selected)}
                  showSelection={showSelection}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="pb-6 text-center text-sm text-muted-foreground">
        Showing {torrents.length} torrent{torrents.length !== 1 ? 's' : ''}
        {someSelected && ` • ${selectedIds.size} selected`}
      </div>

      <TorrentRemoveDialog
        open={showRemoveDialog}
        onOpenChange={(open) => {
          setShowRemoveDialog(open)
          if (!open) setRemoveTargets([])
        }}
        torrents={removeTargets}
        onRemove={handleRemoveConfirm}
      />
    </div>
  )
}
