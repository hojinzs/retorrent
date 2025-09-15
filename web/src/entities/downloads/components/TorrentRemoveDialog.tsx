import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog'
import { Button } from '@shared/components/ui/button'
import { Checkbox } from '@shared/components/ui/checkbox'
import { Label } from '@shared/components/ui/label'
import { AlertTriangle, Loader2 } from 'lucide-react'
import type { Torrent } from '../model'

interface TorrentRemoveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  torrents: Torrent[]
  onRemove: (ids: number[], deleteLocalData: boolean) => Promise<void>
}

export function TorrentRemoveDialog({ 
  open, 
  onOpenChange, 
  torrents, 
  onRemove 
}: TorrentRemoveDialogProps) {
  const [deleteLocalData, setDeleteLocalData] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRemove = async () => {
    try {
      setError(null)
      setIsSubmitting(true)

      const ids = torrents.map(t => t.transmissionId)
      await onRemove(ids, deleteLocalData)

      // Reset form and close dialog
      setDeleteLocalData(false)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove torrents')
    } finally {
      setIsSubmitting(false)
    }
  }

  const torrentCount = torrents.length
  const torrentText = torrentCount === 1 ? 'torrent' : 'torrents'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div>
              <DialogTitle>Remove {torrentCount} {torrentText}</DialogTitle>
              <DialogDescription className="mt-1">
                This action cannot be undone. Are you sure you want to remove {torrentCount === 1 ? 'this torrent' : 'these torrents'}?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Show torrent names */}
          <div className="max-h-40 overflow-y-auto border rounded-md p-3 bg-muted/50">
            <div className="space-y-2">
              {torrents.map((torrent) => (
                <div key={torrent.id} className="text-sm">
                  <div className="font-medium truncate">{torrent.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {torrent.percentDone < 1 
                      ? `${(torrent.percentDone * 100).toFixed(1)}% complete`
                      : 'Complete'
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delete data option */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="deleteLocalData"
                checked={deleteLocalData}
                onCheckedChange={(checked) => setDeleteLocalData(checked as boolean)}
                disabled={isSubmitting}
              />
              <Label htmlFor="deleteLocalData" className="text-sm">
                Also delete downloaded files from disk
              </Label>
            </div>
            
            <div className="text-xs text-muted-foreground pl-6">
              {deleteLocalData 
                ? "⚠️ This will permanently delete all downloaded files for these torrents from your computer."
                : "Downloaded files will remain on your computer and can be re-added later."
              }
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
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={handleRemove}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Remove {torrentCount} {torrentText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}