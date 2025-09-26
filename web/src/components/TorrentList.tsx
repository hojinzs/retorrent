import { useState } from "react";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import { Plus, Search, MoreHorizontal } from "lucide-react";
import { TorrentItem, type TorrentData } from "./TorrentItem";
import { Checkbox } from "@shared/components/ui/checkbox";
import { AddTorrentDialog } from "./AddTorrentDialog";

interface TorrentListProps {
  isMobile: boolean;
}

const mockTorrents: TorrentData[] = [
  {
    id: '1',
    name: 'Ubuntu 22.04.3 Desktop amd64.iso',
    progress: 85,
    downloadSpeed: '2.4 MB/s',
    uploadSpeed: '0.8 MB/s',
    size: '4.6 GB',
    status: 'downloading',
    eta: '5m 32s'
  },
  {
    id: '2',
    name: 'Linux Mint 21.2 Cinnamon',
    progress: 100,
    downloadSpeed: '0 KB/s',
    uploadSpeed: '1.2 MB/s',
    size: '2.8 GB',
    status: 'seeding',
    eta: '∞'
  },
  {
    id: '3',
    name: 'Fedora 38 Workstation',
    progress: 45,
    downloadSpeed: '0 KB/s',
    uploadSpeed: '0 KB/s',
    size: '1.9 GB',
    status: 'paused',
    eta: '∞'
  },
  {
    id: '4',
    name: 'Debian 12.2.0 netinst amd64',
    progress: 67,
    downloadSpeed: '1.8 MB/s',
    uploadSpeed: '0.3 MB/s',
    size: '658 MB',
    status: 'downloading',
    eta: '2m 15s'
  },
  {
    id: '5',
    name: 'openSUSE Tumbleweed DVD x86_64',
    progress: 100,
    downloadSpeed: '0 KB/s',
    uploadSpeed: '2.1 MB/s',
    size: '4.2 GB',
    status: 'completed',
    eta: '∞'
  },
  {
    id: '6',
    name: 'Manjaro KDE Plasma 23.0.4',
    progress: 23,
    downloadSpeed: '3.2 MB/s',
    uploadSpeed: '0.1 MB/s',
    size: '3.5 GB',
    status: 'downloading',
    eta: '18m 42s'
  },
  {
    id: '7',
    name: 'Arch Linux 2023.11.01 x86_64',
    progress: 100,
    downloadSpeed: '0 KB/s',
    uploadSpeed: '0.9 MB/s',
    size: '853 MB',
    status: 'seeding',
    eta: '∞'
  },
  {
    id: '8',
    name: 'CentOS Stream 9 x86_64 dvd1',
    progress: 12,
    downloadSpeed: '0 KB/s',
    uploadSpeed: '0 KB/s',
    size: '9.5 GB',
    status: 'paused',
    eta: '∞'
  }
];

export function TorrentList({ isMobile }: TorrentListProps) {
  const [torrents, setTorrents] = useState<TorrentData[]>(mockTorrents);
  const [selectedTorrents, setSelectedTorrents] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [addTorrentOpen, setAddTorrentOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const handleAddTorrent = () => {
    setAddTorrentOpen(true);
  };

  const handleAddTorrentSubmit = (data: { type: 'magnet' | 'file', content: string, directory?: string, autoStart: boolean }) => {
    // Create new torrent entry
    const newTorrent: TorrentData = {
      id: Date.now().toString(),
      name: data.type === 'magnet' ? 'New Magnet Link' : data.content,
      progress: 0,
      downloadSpeed: '0 KB/s',
      uploadSpeed: '0 KB/s',
      size: 'Unknown',
      status: data.autoStart ? 'downloading' : 'paused',
      eta: '∞'
    };
    
    setTorrents([newTorrent, ...torrents]);
    console.log('Torrent added:', data);
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
    if (checked) {
      setSelectedTorrents(filteredTorrents.map(t => t.id));
    } else {
      setSelectedTorrents([]);
    }
  };

  const handleTorrentSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedTorrents([...selectedTorrents, id]);
    } else {
      setSelectedTorrents(selectedTorrents.filter(tid => tid !== id));
    }
  };

  const handlePause = (id: string) => {
    setTorrents(torrents.map(t => 
      t.id === id ? { ...t, status: 'paused' as const } : t
    ));
  };

  const handleResume = (id: string) => {
    setTorrents(torrents.map(t => 
      t.id === id ? { ...t, status: 'downloading' as const } : t
    ));
  };

  const handleRemove = (id: string) => {
    setTorrents(torrents.filter(t => t.id !== id));
    setSelectedTorrents(selectedTorrents.filter(tid => tid !== id));
  };

  const handleRemoveSelected = () => {
    setTorrents(torrents.filter(t => !selectedTorrents.includes(t.id)));
    setSelectedTorrents([]);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedTorrents([]);
    }
  };

  return (
    <div className={`flex-1 flex flex-col ${isMobile ? 'overflow-auto' : 'h-full'}`}>
      {/* Add Torrent Dialog */}
      <AddTorrentDialog
        open={addTorrentOpen}
        onOpenChange={setAddTorrentOpen}
        onAddTorrent={handleAddTorrentSubmit}
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
              <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={handleAddTorrent}>
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
                {(!isMobile || isSelectionMode) && (
                  <div className="p-4 flex items-center">
                    <Checkbox
                      checked={selectedTorrents.includes(torrent.id)}
                      onCheckedChange={(checked) => handleTorrentSelect(torrent.id, !!checked)}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <TorrentItem
                    torrent={torrent}
                    onPause={handlePause}
                    onResume={handleResume}
                    onRemove={handleRemove}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}