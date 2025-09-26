import { Button } from "@shared/components/ui/button"
import { Card } from "@shared/components/ui/card"
import { Checkbox } from "@shared/components/ui/checkbox"
import { Input } from "@shared/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@shared/components/ui/tabs"
import { useTorrents } from "../entities/downloads/hooks/useTorrents"
import { DownloadItemCard } from "../entities/downloads/components/DownloadItemCard"
import { TorrentAddDialog } from "../entities/downloads/components/TorrentAddDialog"
import { TorrentRemoveDialog } from "../entities/downloads/components/TorrentRemoveDialog"
import { RefreshCw, WifiOff, Plus, Search, MoreHorizontal } from "lucide-react"
import { useState, useCallback } from "react"
import { useIsMobile } from "@shared/hooks/use-mobile"

export function DownloadsPage() {
  const { torrents, isLoading, error, forceSync, controlTorrent, addTorrent, removeTorrents } = useTorrents()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [showSelection, setShowSelection] = useState(false)
  const [removeTargets, setRemoveTargets] = useState<typeof torrents>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const isMobile = useIsMobile()

  // Selection management
  const selectedTorrents = torrents.filter(t => selectedIds.has(t.id))
  const allSelected = torrents.length > 0 && selectedIds.size === torrents.length

  // Filter torrents by search and tab
  const filteredTorrents = torrents.filter(torrent => {
    const matchesSearch = torrent.name.toLowerCase().includes(searchQuery.toLowerCase())
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'active') return matchesSearch && (torrent.status === "download" || torrent.status === "seed");
    if (activeTab === 'downloading') return matchesSearch && torrent.status === "download";
    if (activeTab === 'seeding') return matchesSearch && torrent.status === "seed";
    if (activeTab === 'paused') return matchesSearch && torrent.status === "stopped";
    if (activeTab === 'finished') return matchesSearch && torrent.status === "seed"; // completed
    return matchesSearch;
  })

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredTorrents.map(t => t.id)))
    }
  }, [allSelected, filteredTorrents])

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
    setSelectedIds(new Set()) // Clear selection after removal
    setRemoveTargets([])
    setShowRemoveDialog(false)
  }, [removeTorrents])

  const toggleSelectionMode = useCallback(() => {
    setShowSelection(!showSelection)
    if (showSelection) {
      setSelectedIds(new Set()) // Clear selection when exiting selection mode
    }
  }, [showSelection])

  // Intercept item-level control to show confirmation before remove
  const handleControl = useCallback(async (id: string, action: 'start' | 'stop' | 'remove') => {
    if (action === 'remove') {
      const target = torrents.find(t => t.id === id)
      if (target) {
        setRemoveTargets([target])
        setShowRemoveDialog(true)
      }
      return
    }
    // Delegate start/stop
    await controlTorrent(id, action)
  }, [torrents, controlTorrent])

  // Loading state
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

  // Error state
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
    <div className={`flex-1 flex flex-col ${isMobile ? 'overflow-auto' : 'h-full'}`}>
      {/* Add Torrent Dialog */}
      <TorrentAddDialog onAddTorrent={addTorrent} />

      {/* Mobile Add Torrent FAB */}
      {isMobile && (
        <Button
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all"
          size="sm"
          onClick={() => document.querySelector<HTMLButtonElement>('[data-testid="add-torrent-trigger"]')?.click()}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* Header */}
      <div className={`p-4 border-b border-border ${isMobile ? '' : 'bg-card/50 backdrop-blur-sm'}`}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            {!isMobile && <h1>Downloads</h1>}
            {!isMobile && (
              <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => document.querySelector<HTMLButtonElement>('[data-testid="add-torrent-trigger"]')?.click()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Torrent
              </Button>
            )}
          </div>
          
          <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-4`}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className={isMobile ? 'flex-1' : 'flex-shrink-0'}>
              <TabsList className={`${isMobile ? 'grid w-full grid-cols-3 h-12' : 'flex w-auto h-10'}`}>
                <TabsTrigger value="all" className={isMobile ? 'py-3' : 'px-4'}>
                  All ({torrents.length})
                </TabsTrigger>
                {!isMobile && (
                  <TabsTrigger value="active" className="px-4">
                    Active ({torrents.filter(t => t.status === "download" || t.status === "seed").length})
                  </TabsTrigger>
                )}
                <TabsTrigger value="downloading" className={isMobile ? 'py-3' : 'px-4'}>
                  Downloading ({torrents.filter(t => t.status === "download").length})
                </TabsTrigger>
                {!isMobile && (
                  <TabsTrigger value="seeding" className="px-4">
                    Seeding ({torrents.filter(t => t.status === "seed").length})
                  </TabsTrigger>
                )}
                {!isMobile && (
                  <TabsTrigger value="paused" className="px-4">
                    Paused ({torrents.filter(t => t.status === "stopped").length})
                  </TabsTrigger>
                )}
                <TabsTrigger value="finished" className={isMobile ? 'py-3' : 'px-4'}>
                  Finished ({torrents.filter(t => t.status === "seed").length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {/* Search - Mobile: below tabs, Desktop: right side */}
            <div className={`relative ${isMobile ? 'w-full' : 'w-64 shrink-0'}`}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search torrents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 ${isMobile ? 'h-12' : ''}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Selection Controls */}
      {filteredTorrents.length > 0 && (
        <div className={`p-4 border-b border-border ${isMobile ? '' : 'bg-muted/30'}`}>
          {isMobile && !showSelection ? (
            // Mobile: Show Select button when not in selection mode
            <div className="flex items-center justify-between">
              <span className="caption text-muted-foreground">
                {filteredTorrents.length} torrent{filteredTorrents.length !== 1 ? 's' : ''}
              </span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={toggleSelectionMode}
                className="border-border text-foreground hover:bg-accent/50"
              >
                Select
              </Button>
            </div>
          ) : (
            // Desktop or Mobile selection mode: Show selection controls
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectedIds.size === filteredTorrents.length && filteredTorrents.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="caption">
                  Select All ({selectedIds.size}/{filteredTorrents.length})
                </span>
              </div>
              <div className="flex items-center gap-2">
                {selectedIds.size > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRemoveSelected}
                    className="border-border text-foreground hover:bg-accent/50"
                  >
                    Remove Selected
                  </Button>
                )}
                {isMobile && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={toggleSelectionMode}
                    className="border-border text-foreground hover:bg-accent/50"
                  >
                    Cancel
                  </Button>
                )}
                {!isMobile && selectedIds.size > 0 && (
                  <Button size="sm" variant="ghost">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Torrent List */}
      <div className={isMobile ? 'pb-24' : 'flex-1 overflow-auto'}>
        {filteredTorrents.length === 0 ? (
          <div className={`flex items-center justify-center ${isMobile ? 'py-20' : 'h-full'}`}>
            <div className="text-center">
              <p className="text-muted-foreground">No torrents found</p>
              <p className="caption text-muted-foreground mt-1">
                {searchQuery ? 'Try adjusting your search' : 'Add a torrent to get started'}
              </p>
            </div>
          </div>
        ) : (
          <div>
            {filteredTorrents.map(torrent => (
              <div key={torrent.id} className="flex items-start">
                {(!isMobile || showSelection) && (
                  <div className="p-4 flex items-center">
                    <Checkbox
                      checked={selectedIds.has(torrent.id)}
                      onCheckedChange={(checked) => handleSelectTorrent(torrent.id, !!checked)}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <DownloadItemCard
                    torrent={torrent}
                    onControl={handleControl}
                    isSelected={selectedIds.has(torrent.id)}
                    onSelectionChange={(selected) => handleSelectTorrent(torrent.id, selected)}
                    showSelection={showSelection}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Remove confirmation dialog */}
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