import { Button } from "@shared/components/ui/button"
import { Card } from "@shared/components/ui/card"
import { Badge } from "@shared/components/ui/badge"
import { Checkbox } from "@shared/components/ui/checkbox"
import { useTorrents } from "../entities/downloads/hooks/useTorrents"
import { DownloadItemCard } from "../entities/downloads/components/DownloadItemCard"
import { TorrentAddDialog } from "../entities/downloads/components/TorrentAddDialog"
import { TorrentRemoveDialog } from "../entities/downloads/components/TorrentRemoveDialog"
import { RefreshCw, Wifi, WifiOff, Trash2, CheckSquare, Square } from "lucide-react"
import { useState, useCallback } from "react"

export function DownloadsPage() {
  const { torrents, isLoading, error, forceSync, controlTorrent, addTorrent, removeTorrents } = useTorrents()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [showSelection, setShowSelection] = useState(false)

  // Selection management
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
      setShowRemoveDialog(true)
    }
  }, [selectedTorrents])

  const handleRemoveConfirm = useCallback(async (ids: number[], deleteLocalData: boolean) => {
    await removeTorrents(ids, deleteLocalData)
    setSelectedIds(new Set()) // Clear selection after removal
  }, [removeTorrents])

  const toggleSelectionMode = useCallback(() => {
    setShowSelection(!showSelection)
    if (showSelection) {
      setSelectedIds(new Set()) // Clear selection when exiting selection mode
    }
  }, [showSelection])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading torrents...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 max-w-md">
          <div className="text-center">
            <WifiOff className="h-8 w-8 mx-auto mb-4 text-destructive" />
            <h3 className="font-semibold mb-2">Connection Error</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={forceSync} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Downloads</h1>
          <p className="text-muted-foreground">
            Manage your torrents in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Wifi className="h-3 w-3" />
            Real-time
          </Badge>
          <Button onClick={forceSync} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync
          </Button>
          <TorrentAddDialog onAddTorrent={addTorrent} />
        </div>
      </div>

      {/* Selection controls */}
      {torrents.length > 0 && (
        <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleSelectionMode}
            >
              {showSelection ? <Square className="h-4 w-4 mr-2" /> : <CheckSquare className="h-4 w-4 mr-2" />}
              {showSelection ? 'Cancel Selection' : 'Select Torrents'}
            </Button>
            
            {showSelection && (
              <>
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all torrents"
                />
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
                </span>
              </>
            )}
          </div>

          {showSelection && someSelected && (
            <div className="flex items-center gap-2">
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleRemoveSelected}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Selected ({selectedIds.size})
              </Button>
            </div>
          )}
        </div>
      )}

      {torrents.length === 0 ? (
        <Card className="p-12 text-center">
          <h3 className="font-semibold mb-2">No torrents found</h3>
          <p className="text-muted-foreground mb-4">
            Add some torrents to get started.
          </p>
          <div className="flex items-center justify-center gap-2">
            <TorrentAddDialog onAddTorrent={addTorrent} />
            <Button onClick={forceSync} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Check for torrents
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {torrents.map((torrent) => (
            <DownloadItemCard
              key={torrent.id}
              torrent={torrent}
              onControl={controlTorrent}
              isSelected={selectedIds.has(torrent.id)}
              onSelectionChange={(selected) => handleSelectTorrent(torrent.id, selected)}
              showSelection={showSelection}
            />
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Showing {torrents.length} torrent{torrents.length !== 1 ? 's' : ''}
          {someSelected && ` (${selectedIds.size} selected)`}
        </p>
      </div>

      {/* Remove confirmation dialog */}
      <TorrentRemoveDialog
        open={showRemoveDialog}
        onOpenChange={setShowRemoveDialog}
        torrents={selectedTorrents}
        onRemove={handleRemoveConfirm}
      />
    </div>
  )
}