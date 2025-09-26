import { Button } from "@shared/components/ui/button"
import { Input } from "@shared/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@shared/components/ui/tabs"
import { Plus, Search, MoreHorizontal } from "lucide-react"
import { TorrentItem, type TorrentData } from "../components/TorrentItem"
import { Checkbox } from "@shared/components/ui/checkbox"
import { AddTorrentDialog } from "../components/AddTorrentDialog"
import { useIsMobile } from "@shared/hooks/use-mobile"
import { useTorrents } from "../entities/downloads/hooks/useTorrents"
import { TorrentRemoveDialog } from "../entities/downloads/components/TorrentRemoveDialog"
import { RefreshCw, WifiOff } from "lucide-react"
import { useState, useCallback } from "react"

// Convert backend torrent data to TorrentData format for the TorrentItem component
const convertTorrentData = (backendTorrent: any): TorrentData => {
  let status: 'downloading' | 'seeding' | 'paused' | 'completed';
  
  if (backendTorrent.status === 'download') {
    status = 'downloading';
  } else if (backendTorrent.status === 'seed') {
    status = 'seeding';
  } else if (backendTorrent.status === 'stopped') {
    status = 'paused';
  } else {
    status = 'completed';
  }

  return {
    id: backendTorrent.id,
    name: backendTorrent.name,
    progress: Math.round(backendTorrent.percentDone * 100),
    downloadSpeed: backendTorrent.rateDownload > 0 ? `${(backendTorrent.rateDownload / 1024 / 1024).toFixed(1)} MB/s` : '0 KB/s',
    uploadSpeed: backendTorrent.rateUpload > 0 ? `${(backendTorrent.rateUpload / 1024 / 1024).toFixed(1)} MB/s` : '0 KB/s',
    size: `${(backendTorrent.sizeWhenDone / 1024 / 1024 / 1024).toFixed(1)} GB`,
    status,
    eta: backendTorrent.eta > 0 ? `${Math.round(backendTorrent.eta / 60)}m ${backendTorrent.eta % 60}s` : '∞'
  };
};

export function DownloadsPage() {
  const isMobile = useIsMobile()
  const { torrents: backendTorrents, isLoading, error, forceSync, controlTorrent, addTorrent, removeTorrents } = useTorrents()
  const [selectedTorrents, setSelectedTorrents] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [addTorrentOpen, setAddTorrentOpen] = useState(false)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [removeTargets, setRemoveTargets] = useState<any[]>([])

  // Convert backend data to TorrentData format
  const torrents = backendTorrents.map(convertTorrentData)

  // Filter torrents by search and tab
  const filteredTorrents = torrents.filter(torrent => {
    const matchesSearch = torrent.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    switch (activeTab) {
      case 'all':
        return matchesSearch
      case 'active':
        return matchesSearch && (torrent.status === 'downloading' || torrent.status === 'seeding')
      case 'downloading':
        return matchesSearch && torrent.status === 'downloading'
      case 'seeding':
        return matchesSearch && torrent.status === 'seeding'
      case 'paused':
        return matchesSearch && torrent.status === 'paused'
      case 'finished':
        return matchesSearch && torrent.status === 'completed'
      default:
        return matchesSearch
    }
  })

  const handleSelectTorrent = useCallback((torrentId: string, selected: boolean) => {
    if (selected) {
      setSelectedTorrents(prev => [...prev, torrentId])
    } else {
      setSelectedTorrents(prev => prev.filter(id => id !== torrentId))
    }
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedTorrents.length === filteredTorrents.length) {
      setSelectedTorrents([])
    } else {
      setSelectedTorrents(filteredTorrents.map(t => t.id))
    }
  }, [selectedTorrents.length, filteredTorrents])

  const handleRemoveSelected = useCallback(() => {
    if (selectedTorrents.length > 0) {
      const targetsToRemove = backendTorrents.filter(t => selectedTorrents.includes(t.id))
      setRemoveTargets(targetsToRemove)
      setShowRemoveDialog(true)
    }
  }, [selectedTorrents, backendTorrents])

  const handleRemoveConfirm = useCallback(async (ids: number[], deleteLocalData: boolean) => {
    await removeTorrents(ids, deleteLocalData)
    setSelectedTorrents([])
    setRemoveTargets([])
    setShowRemoveDialog(false)
  }, [removeTorrents])

  const handleTorrentAction = useCallback(async (torrentId: string, action: 'play' | 'pause' | 'remove') => {
    if (action === 'remove') {
      const target = backendTorrents.find(t => t.id === torrentId)
      if (target) {
        setRemoveTargets([target])
        setShowRemoveDialog(true)
      }
      return
    }
    
    const backendAction = action === 'play' ? 'start' : 'stop'
    await controlTorrent(torrentId, backendAction)
  }, [backendTorrents, controlTorrent])

  const handleAddTorrent = async (data: { type: 'magnet' | 'file', content: string, directory?: string, autoStart: boolean }) => {
    try {
      if (data.type === 'magnet') {
        await addTorrent(data.content, { 
          downloadDir: data.directory, 
          autoStart: data.autoStart 
        })
      } else {
        await addTorrent(data.content, { 
          downloadDir: data.directory, 
          autoStart: data.autoStart 
        })
      }
      setAddTorrentOpen(false)
    } catch (error) {
      console.error('Failed to add torrent:', error)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
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
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-card border border-border rounded-xl">
          <WifiOff className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <h3 className="font-semibold mb-2">Connection Error</h3>
          <p className="caption text-muted-foreground mb-4">{error}</p>
          <Button onClick={forceSync} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex-1 flex flex-col ${isMobile ? 'overflow-auto' : 'h-full'}`}>
      {/* Mobile Add Torrent FAB */}
      {isMobile && (
        <Button
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg bg-green-600 hover:bg-green-700 text-white transition-all"
          size="sm"
          onClick={() => setAddTorrentOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* Header */}
      <div className={`${isMobile ? 'p-4' : 'p-8'} border-b border-border`}>
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1>{isMobile ? 'Downloads' : 'Downloads'}</h1>
            {!isMobile && (
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setAddTorrentOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Torrent
              </Button>
            )}
          </div>
          
          <div className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center gap-6'}`}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className={isMobile ? 'w-full' : ''}>
              <TabsList className={isMobile ? 'grid w-full grid-cols-3 h-12' : 'h-11'}>
                <TabsTrigger value="all" className={isMobile ? 'py-3' : 'px-6 py-2'}>
                  All ({torrents.length})
                </TabsTrigger>
                {!isMobile && (
                  <TabsTrigger value="active" className="px-6 py-2">
                    Active
                  </TabsTrigger>
                )}
                <TabsTrigger value="downloading" className={isMobile ? 'py-3' : 'px-6 py-2'}>
                  Downloading
                </TabsTrigger>
                {!isMobile && (
                  <>
                    <TabsTrigger value="seeding" className="px-6 py-2">
                      Seeding
                    </TabsTrigger>
                    <TabsTrigger value="paused" className="px-6 py-2">
                      Paused
                    </TabsTrigger>
                  </>
                )}
                <TabsTrigger value="finished" className={isMobile ? 'py-3' : 'px-6 py-2'}>
                  Finished
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className={`relative ${isMobile ? 'w-full' : 'w-80'}`}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search torrents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 ${isMobile ? 'h-12' : 'h-11'}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Selection Controls - Desktop or when in selection mode on mobile */}
      {filteredTorrents.length > 0 && (
        <div className="px-8 py-4 border-b border-border">
          {isMobile && !isSelectionMode ? (
            <div className="flex items-center justify-between">
              <span className="caption text-muted-foreground">
                {filteredTorrents.length} torrent{filteredTorrents.length !== 1 ? 's' : ''}
              </span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setIsSelectionMode(true)}
              >
                Select
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectedTorrents.length === filteredTorrents.length && filteredTorrents.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="caption">
                  Select All ({selectedTorrents.length}/{filteredTorrents.length})
                </span>
              </div>
              <div className="flex items-center gap-2">
                {selectedTorrents.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRemoveSelected}
                  >
                    Remove Selected
                  </Button>
                )}
                {isMobile && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsSelectionMode(false)
                      setSelectedTorrents([])
                    }}
                  >
                    Cancel
                  </Button>
                )}
                {!isMobile && selectedTorrents.length > 0 && (
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
      <div className={`flex-1 ${isMobile ? 'pb-24' : 'overflow-auto'}`}>
        {filteredTorrents.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">No torrents found</p>
              <p className="caption text-muted-foreground">
                {searchQuery ? 'Try adjusting your search' : 'Add a torrent to get started'}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredTorrents.map(torrent => (
              <div key={torrent.id} className="flex items-center px-8">
                {(!isMobile || isSelectionMode) && (
                  <div className="py-4 pr-4">
                    <Checkbox
                      checked={selectedTorrents.includes(torrent.id)}
                      onCheckedChange={(checked) => handleSelectTorrent(torrent.id, !!checked)}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <TorrentItem
                    torrent={torrent}
                    onAction={handleTorrentAction}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Torrent Dialog */}
      <AddTorrentDialog 
        open={addTorrentOpen} 
        onOpenChange={setAddTorrentOpen}
        onAddTorrent={handleAddTorrent}
      />

      {/* Remove Torrent Dialog */}
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