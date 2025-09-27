import { useState } from "react";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import { Plus, Search, MoreHorizontal } from "lucide-react";
import { TorrentItem, type TorrentData } from "./TorrentItem";
import { Checkbox } from "@shared/components/ui/checkbox";
import { AddTorrentDialog } from "./AddTorrentDialog";
import { useTorrents } from "../entities/downloads/hooks/useTorrents";
import { TorrentRemoveDialog } from "../entities/downloads/components/TorrentRemoveDialog";
import { RefreshCw, WifiOff } from "lucide-react";

interface TorrentListProps {
  isMobile: boolean;
}

// Convert backend torrent data to TorrentData format
const convertTorrentData = (backendTorrent: any): TorrentData => ({
  id: backendTorrent.id,
  name: backendTorrent.name,
  progress: Math.round(backendTorrent.percentDone * 100),
  downloadSpeed: backendTorrent.rateDownload > 0 ? `${(backendTorrent.rateDownload / 1024 / 1024).toFixed(1)} MB/s` : '0 KB/s',
  uploadSpeed: backendTorrent.rateUpload > 0 ? `${(backendTorrent.rateUpload / 1024 / 1024).toFixed(1)} MB/s` : '0 KB/s',
  size: `${(backendTorrent.sizeWhenDone / 1024 / 1024 / 1024).toFixed(1)} GB`,
  status: backendTorrent.status === 'download' ? 'downloading' :
          backendTorrent.status === 'seed' ? 'seeding' :
          backendTorrent.status === 'stopped' ? 'paused' : 'completed',
  eta: backendTorrent.eta > 0 ? `${Math.round(backendTorrent.eta / 60)}m ${backendTorrent.eta % 60}s` : '∞'
});

export function TorrentList({ isMobile }: TorrentListProps) {
  const { torrents: backendTorrents, isLoading, error, forceSync, controlTorrent, addTorrent, removeTorrents } = useTorrents();
  const [selectedTorrents, setSelectedTorrents] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [addTorrentOpen, setAddTorrentOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [removeTargets, setRemoveTargets] = useState<any[]>([]);

  // Convert backend data to TorrentData format
  const torrents = backendTorrents.map(convertTorrentData);

  const handleAddTorrent = () => {
    setAddTorrentOpen(true);
  };

  const handleAddTorrentSubmit = async (data: { type: 'magnet' | 'file', content: string, directory?: string, autoStart: boolean }) => {
    try {
      if (data.type === 'magnet') {
        await addTorrent(data.content, { downloadDir: data.directory, autoStart: data.autoStart });
      }
      // For file uploads, you'd need to implement file handling in the backend
      console.log('Torrent added:', data);
    } catch (error) {
      console.error('Failed to add torrent:', error);
    }
  };

  const filteredTorrents = torrents.filter(torrent => {
    const matchesSearch = torrent.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'active') return matchesSearch && (torrent.status === 'downloading' || torrent.status === 'seeding');
    if (activeTab === 'downloading') return matchesSearch && torrent.status === 'downloading';
    if (activeTab === 'seeding') return matchesSearch && torrent.status === 'seeding';
    if (activeTab === 'paused') return matchesSearch && torrent.status === 'paused';
    if (activeTab === 'finished') return matchesSearch && torrent.status === 'completed';
    return matchesSearch;
  });

  const handleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelectedTorrents([]);
      return;
    }
    setSelectedTorrents(filteredTorrents.map(t => t.id));
  };

  const handleTorrentSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedTorrents([...selectedTorrents, id]);
    } else {
      setSelectedTorrents(selectedTorrents.filter(tid => tid !== id));
    }
  };

  const handlePause = async (id: string) => {
    const backendTorrent = backendTorrents.find(t => t.id === id);
    if (backendTorrent) {
      await controlTorrent(backendTorrent.id, 'stop');
    }
  };

  const handleResume = async (id: string) => {
    const backendTorrent = backendTorrents.find(t => t.id === id);
    if (backendTorrent) {
      await controlTorrent(backendTorrent.id, 'start');
    }
  };

  const handleRemove = (id: string) => {
    const target = backendTorrents.find(t => t.id === id);
    if (target) {
      setRemoveTargets([target]);
      setShowRemoveDialog(true);
    }
  };

  const handleRemoveSelected = () => {
    const targets = backendTorrents.filter(t => selectedTorrents.includes(t.id));
    setRemoveTargets(targets);
    setShowRemoveDialog(true);
  };

  const handleRemoveConfirm = async (ids: number[], deleteLocalData: boolean) => {
    await removeTorrents(ids, deleteLocalData);
    setSelectedTorrents([]);
    setRemoveTargets([]);
    setShowRemoveDialog(false);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedTorrents([]);
    }
  };

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <WifiOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <div>
            <h3 className="text-lg font-medium">Connection Error</h3>
            <p className="text-muted-foreground">Failed to connect to Transmission daemon</p>
          </div>
          <Button onClick={forceSync} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col ${isMobile ? 'overflow-auto' : 'h-full'}`}>
      {/* Add Torrent Dialog */}
      <AddTorrentDialog
        open={addTorrentOpen}
        onOpenChange={setAddTorrentOpen}
        onAddTorrent={handleAddTorrentSubmit}
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

      {/* Mobile Add Torrent FAB */}
      {isMobile && (
        <Button
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all"
          size="sm"
          onClick={handleAddTorrent}
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
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={forceSync}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Sync
                </Button>
                <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={handleAddTorrent}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Torrent
                </Button>
              </div>
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
                    Active ({torrents.filter(t => t.status === 'downloading' || t.status === 'seeding').length})
                  </TabsTrigger>
                )}
                <TabsTrigger value="downloading" className={isMobile ? 'py-3' : 'px-4'}>
                  Downloading ({torrents.filter(t => t.status === 'downloading').length})
                </TabsTrigger>
                {!isMobile && (
                  <TabsTrigger value="seeding" className="px-4">
                    Seeding ({torrents.filter(t => t.status === 'seeding').length})
                  </TabsTrigger>
                )}
                {!isMobile && (
                  <TabsTrigger value="paused" className="px-4">
                    Paused ({torrents.filter(t => t.status === 'paused').length})
                  </TabsTrigger>
                )}
                <TabsTrigger value="finished" className={isMobile ? 'py-3' : 'px-4'}>
                  Finished ({torrents.filter(t => t.status === 'completed').length})
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
          {isMobile && !isSelectionMode ? (
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
                checked={filteredTorrents.length > 0 && selectedTorrents.length === filteredTorrents.length}
                onCheckedChange={(value) => handleSelectAll(!!value)}
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
      <div className={isMobile ? 'pb-24' : 'flex-1 overflow-auto'}>
        {isLoading && torrents.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredTorrents.length === 0 ? (
          <div className={`flex items-center justify-center ${isMobile ? 'py-20' : 'h-full'}`}>
            <div className="text-center">
              <p className="text-muted-foreground">No torrents found</p>
              <p className="caption text-muted-foreground mt-1">
                {searchQuery ? 'Try adjusting your search' : 'Add a torrent to get started'}
              </p>
            </div>
          </div>
        ) : (
          <div className={`flex flex-col ${isMobile ? 'gap-3 px-4 pb-20' : 'gap-4 px-6'}`}>
            {filteredTorrents.map(torrent => (
              <TorrentItem
                key={torrent.id}
                torrent={torrent}
                onAction={(id, action) => {
                  if (action === 'play') handleResume(id);
                  else if (action === 'pause') handlePause(id);
                  else if (action === 'remove') handleRemove(id);
                }}
                showSelectionCheckbox={!isMobile || isSelectionMode}
                selectionMode={isMobile && isSelectionMode}
                selected={selectedTorrents.includes(torrent.id)}
                onSelectChange={(checked) => handleTorrentSelect(torrent.id, checked)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}