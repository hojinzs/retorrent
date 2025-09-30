import React, { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Dialog, DialogClose, DialogOverlay, DialogPortal, DialogTitle } from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Textarea } from "@shared/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import { Checkbox } from "@shared/components/ui/checkbox";
import { Label } from "@shared/components/ui/label";
import { Link, Upload, X } from "lucide-react";

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

  const resetForm = () => {
    // Reset form
    setMagnetLink('');
    setTorrentFile(null);
    setDownloadDirectory('');
    setAutoStart(true);
    setActiveTab('magnet');
    setError(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-white/50 dark:bg-black/50 transition-all data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          className="fixed inset-x-4 bottom-6 z-50 mx-auto w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-3xl border border-white/30 bg-white/25 p-0 text-foreground shadow-[0_25px_70px_-30px_rgba(15,23,42,0.75)] backdrop-blur-2xl transition-all data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-8 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-8 dark:border-white/10 dark:bg-neutral-900/50 sm:inset-x-auto sm:right-6 sm:left-auto"
        >
          <div className="relative overflow-hidden">
            <div
              className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-white/5 opacity-70 dark:from-neutral-900/70 dark:via-neutral-900/40 dark:to-neutral-900/20"
              aria-hidden="true"
            />
            <div className="relative">
              <div className="flex items-start justify-between gap-4 px-6 pt-6">
                <div>
                  <DialogTitle className="text-lg font-semibold text-foreground">Add New Torrent</DialogTitle>
                  <p className="caption text-muted-foreground mt-2">
                    Upload a torrent file or paste a magnet link to add a new torrent.
                  </p>
                </div>
                <DialogClose
                  className="rounded-full border border-white/40 bg-white/60 p-1 text-muted-foreground shadow-sm transition-colors hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-white/50 dark:border-white/10 dark:bg-neutral-800/80 dark:hover:bg-neutral-700"
                  aria-label="Close add torrent dialog"
                >
                  <X className="h-4 w-4" />
                </DialogClose>
              </div>

              <div className="px-6 pb-6 pt-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="mb-6 grid w-full grid-cols-2">
                    <TabsTrigger value="magnet" className="flex items-center gap-2">
                      <Link className="h-4 w-4" />
                      Magnet Link
                    </TabsTrigger>
                    <TabsTrigger value="file" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Torrent File
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="magnet" className="mt-0 space-y-4">
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

                  <TabsContent value="file" className="mt-0 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">Torrent File</Label>
                      <div className="rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors hover:border-border/80">
                        <input
                          type="file"
                          accept=".torrent"
                          onChange={handleFileChange}
                          className="hidden"
                          id="torrent-file"
                          disabled={isSubmitting}
                        />
                        <label htmlFor="torrent-file" className="flex cursor-pointer flex-col items-center gap-2">
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

                <div className="mt-6 space-y-4">
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
                    <Label htmlFor="auto-start" className="cursor-pointer text-foreground">
                      Start torrent automatically
                    </Label>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
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
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
