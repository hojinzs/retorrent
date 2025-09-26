import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@shared/components/ui/dialog'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { Label } from '@shared/components/ui/label'
import { Checkbox } from '@shared/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs'
import { Plus, Upload, Magnet, Loader2 } from 'lucide-react'

interface TorrentAddDialogProps {
  onAddTorrent: (torrent: string, options?: { downloadDir?: string; autoStart?: boolean }) => Promise<any>
}

export function TorrentAddDialog({ onAddTorrent }: TorrentAddDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('magnet')
  const [magnetLink, setMagnetLink] = useState('')
  const [downloadDir, setDownloadDir] = useState('')
  const [autoStart, setAutoStart] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.torrent')) {
      setError('Please select a .torrent file')
      return
    }

    try {
      setError(null)
      setIsSubmitting(true)

      // Convert file to base64 - using reliable data URL approach
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          try {
            const result = reader.result as string
            // Data URLs have format: data:[<mediatype>][;base64],<data>
            // Find the comma that separates metadata from data
            const commaIndex = result.indexOf(',')
            if (commaIndex === -1 || commaIndex === result.length - 1) {
              reject(new Error('Invalid data URL format'))
              return
            }
            // Extract everything after the comma
            const base64Data = result.substring(commaIndex + 1)
            // Basic validation - check if it looks like base64
            if (!base64Data || base64Data.length === 0) {
              reject(new Error('Empty base64 data'))
              return
            }
            
            // Additional validation - check if it contains only valid base64 characters
            const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
            if (!base64Regex.test(base64Data)) {
              console.error('Invalid base64 characters detected:', base64Data.substring(0, 100))
              reject(new Error('Generated data contains invalid base64 characters'))
              return
            }
            
            console.log('File successfully converted to base64:', {
              fileName: file.name,
              fileSize: file.size,
              base64Length: base64Data.length,
              firstChars: base64Data.substring(0, 20)
            })
            
            resolve(base64Data)
          } catch (error) {
            reject(error)
          }
        }
        reader.onerror = () => reject(reader.error || new Error('Failed to read file'))
        reader.readAsDataURL(file)
      })

      await onAddTorrent(base64, {
        downloadDir: downloadDir || undefined,
        autoStart,
      })

      // Reset form and close dialog
      setMagnetLink('')
      setDownloadDir('')
      setAutoStart(true)
      setOpen(false)
      event.target.value = '' // Reset file input
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add torrent file')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMagnetSubmit = async () => {
    if (!magnetLink.trim()) {
      setError('Please enter a magnet link')
      return
    }

    if (!magnetLink.startsWith('magnet:')) {
      setError('Please enter a valid magnet link (must start with "magnet:")')
      return
    }

    try {
      setError(null)
      setIsSubmitting(true)

      await onAddTorrent(magnetLink, {
        downloadDir: downloadDir || undefined,
        autoStart,
      })

      // Reset form and close dialog
      setMagnetLink('')
      setDownloadDir('')
      setAutoStart(true)
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add magnet link')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Torrent
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Torrent</DialogTitle>
          <DialogDescription>
            Upload a torrent file or paste a magnet link to add a new torrent.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="magnet">
                <Magnet className="h-4 w-4 mr-2" />
                Magnet Link
              </TabsTrigger>
              <TabsTrigger value="file">
                <Upload className="h-4 w-4 mr-2" />
                Torrent File
              </TabsTrigger>
            </TabsList>

            <TabsContent value="magnet" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="magnet">Magnet Link</Label>
                <Input
                  id="magnet"
                  placeholder="magnet:?xt=urn:btih:..."
                  value={magnetLink}
                  onChange={(e) => setMagnetLink(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </TabsContent>

            <TabsContent value="file" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">Torrent File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".torrent"
                  onChange={handleFileUpload}
                  disabled={isSubmitting}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Options */}
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="downloadDir">Download Directory (Optional)</Label>
              <Input
                id="downloadDir"
                placeholder="/path/to/download/directory"
                value={downloadDir}
                onChange={(e) => setDownloadDir(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoStart"
                checked={autoStart}
                onCheckedChange={(checked) => setAutoStart(checked as boolean)}
                disabled={isSubmitting}
              />
              <Label htmlFor="autoStart">Start torrent automatically</Label>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          {activeTab === 'magnet' && (
            <Button 
              onClick={handleMagnetSubmit}
              disabled={isSubmitting || !magnetLink.trim()}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Magnet Link
            </Button>
          )}
          {/* File tab doesn't need a submit button as upload is handled automatically */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}