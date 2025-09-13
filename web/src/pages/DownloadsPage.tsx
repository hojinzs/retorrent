import { Button } from "@shared/components/ui/button"
import { Card } from "@shared/components/ui/card"
import { Badge } from "@shared/components/ui/badge"
import { useTorrents } from "../entities/downloads/hooks/useTorrents"
import { DownloadItemCard } from "../entities/downloads/components/DownloadItemCard"
import { RefreshCw, Wifi, WifiOff } from "lucide-react"

export function DownloadsPage() {
  const { torrents, isLoading, error, forceSync, controlTorrent } = useTorrents()

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
        </div>
      </div>

      {torrents.length === 0 ? (
        <Card className="p-12 text-center">
          <h3 className="font-semibold mb-2">No torrents found</h3>
          <p className="text-muted-foreground mb-4">
            Add some torrents to Transmission to see them here.
          </p>
          <Button onClick={forceSync} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Check for torrents
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {torrents.map((torrent) => (
            <DownloadItemCard
              key={torrent.id}
              torrent={torrent}
              onControl={controlTorrent}
            />
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Showing {torrents.length} torrent{torrents.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}