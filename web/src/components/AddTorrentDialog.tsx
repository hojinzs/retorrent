import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Textarea } from "@shared/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import { Checkbox } from "@shared/components/ui/checkbox";
import { Label } from "@shared/components/ui/label";
import { Link, Upload } from "lucide-react";

interface AddTorrentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTorrent: (data: { type: 'magnet' | 'file', content: string, directory?: string, autoStart: boolean }) => Promise<unknown> | void;
}

const readFileAsBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const result = reader.result as string;
    const base64 = result.includes(',') ? result.split(',')[1] : result;
    resolve(base64);
  };
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

export function AddTorrentDialog({ open, onOpenChange, onAddTorrent }: AddTorrentDialogProps) {
  const [activeTab, setActiveTab] = useState('magnet');
  const [magnetLink, setMagnetLink] = useState('');
  const [torrentFile, setTorrentFile] = useState<File | null>(null);
  const [downloadDirectory, setDownloadDirectory] = useState('');
  const [autoStart, setAutoStart] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    onOpenChange(false);
    // Reset form
    setMagnetLink('');
    setTorrentFile(null);
    setDownloadDirectory('');
    setAutoStart(true);
    setActiveTab('magnet');
    setError(null);
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    if (activeTab === 'magnet' && magnetLink.trim()) {
      try {
        setError(null);
        setIsSubmitting(true);
        await Promise.resolve(onAddTorrent({
          type: 'magnet',
          content: magnetLink.trim(),
          directory: downloadDirectory || undefined,
          autoStart
        }));
        handleClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add magnet link');
      } finally {
        setIsSubmitting(false);
      }
    } else if (activeTab === 'file' && torrentFile) {
      try {
        setError(null);
        setIsSubmitting(true);
        const base64 = await readFileAsBase64(torrentFile);
        await Promise.resolve(onAddTorrent({
          type: 'file',
          content: base64,
          directory: downloadDirectory || undefined,
          autoStart
        }));
        handleClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add torrent file');
        setIsSubmitting(false);
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setTorrentFile(null);
      return;
    }

    if (!file.name.endsWith('.torrent')) {
      setError('Please select a .torrent file');
      setTorrentFile(null);
      return;
    }

    setError(null);
    setTorrentFile(file);
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
                  className="min-h-[80px] resize-none bg-input border-border text-foreground placeholder:text-muted-foreground"
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
                    disabled={isSubmitting}
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
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-start"
                checked={autoStart}
                onCheckedChange={(checked) => setAutoStart(!!checked)}
                disabled={isSubmitting}
              />
              <Label htmlFor="auto-start" className="text-foreground cursor-pointer">
                Start torrent automatically
              </Label>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-border text-foreground hover:bg-accent/50"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isSubmitEnabled || isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Adding…' : activeTab === 'magnet' ? 'Add Magnet Link' : 'Upload File'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}