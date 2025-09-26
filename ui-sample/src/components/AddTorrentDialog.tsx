import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Link, Upload } from "lucide-react";

interface AddTorrentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTorrent: (data: { type: 'magnet' | 'file', content: string, directory?: string, autoStart: boolean }) => void;
}

export function AddTorrentDialog({ open, onOpenChange, onAddTorrent }: AddTorrentDialogProps) {
  const [activeTab, setActiveTab] = useState('magnet');
  const [magnetLink, setMagnetLink] = useState('');
  const [torrentFile, setTorrentFile] = useState<File | null>(null);
  const [downloadDirectory, setDownloadDirectory] = useState('');
  const [autoStart, setAutoStart] = useState(true);

  const handleClose = () => {
    onOpenChange(false);
    // Reset form
    setMagnetLink('');
    setTorrentFile(null);
    setDownloadDirectory('');
    setAutoStart(true);
    setActiveTab('magnet');
  };

  const handleSubmit = () => {
    if (activeTab === 'magnet' && magnetLink.trim()) {
      onAddTorrent({
        type: 'magnet',
        content: magnetLink.trim(),
        directory: downloadDirectory || undefined,
        autoStart
      });
    } else if (activeTab === 'file' && torrentFile) {
      onAddTorrent({
        type: 'file',
        content: torrentFile.name, // In real implementation, this would be the file content
        directory: downloadDirectory || undefined,
        autoStart
      });
    }
    handleClose();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.torrent')) {
      setTorrentFile(file);
    }
  };

  const isSubmitEnabled = (activeTab === 'magnet' && magnetLink.trim()) || 
                         (activeTab === 'file' && torrentFile);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 bg-card border-border dialog-backdrop">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-foreground">Add New Torrent</DialogTitle>
          <p className="caption text-muted-foreground mt-2">
            Upload a torrent file or paste a magnet link to add a new torrent.
          </p>
        </DialogHeader>

        <div className="px-6 pb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="magnet" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Magnet Link
              </TabsTrigger>
              <TabsTrigger value="file" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Torrent File
              </TabsTrigger>
            </TabsList>

            <TabsContent value="magnet" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label className="text-foreground">Magnet Link</Label>
                <Textarea
                  placeholder="magnet:?xt=urn:btih:..."
                  value={magnetLink}
                  onChange={(e) => setMagnetLink(e.target.value)}
                  className="min-h-[80px] resize-none bg-input-background border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </TabsContent>

            <TabsContent value="file" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label className="text-foreground">Torrent File</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-border/80 transition-colors">
                  <input
                    type="file"
                    accept=".torrent"
                    onChange={handleFileChange}
                    className="hidden"
                    id="torrent-file"
                  />
                  <label
                    htmlFor="torrent-file"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    {torrentFile ? (
                      <div className="text-center">
                        <p className="caption text-foreground">{torrentFile.name}</p>
                        <p className="detail text-muted-foreground">Click to change file</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="caption text-foreground">Click to select torrent file</p>
                        <p className="detail text-muted-foreground">or drag and drop</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label className="text-foreground">Download Directory (Optional)</Label>
              <Input
                placeholder="/path/to/download/directory"
                value={downloadDirectory}
                onChange={(e) => setDownloadDirectory(e.target.value)}
                className="bg-input-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-start"
                checked={autoStart}
                onCheckedChange={setAutoStart}
              />
              <Label htmlFor="auto-start" className="text-foreground cursor-pointer">
                Start torrent automatically
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-border text-foreground hover:bg-accent/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isSubmitEnabled}
              className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {activeTab === 'magnet' ? 'Add Magnet Link' : 'Upload File'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}