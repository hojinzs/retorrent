import { Badge } from "@shared/components/ui/badge"
import { Button } from "@shared/components/ui/button"
import { Card } from "@shared/components/ui/card"
import { Progress } from "@shared/components/ui/progress"
import type {Torrent} from "../model"

export function DownloadItemCard({ torrent }: { torrent: Torrent }) {
  return (
    <Card>
      <div className="flex items-center justify-between p-3 pr-4">
        <div className="flex flex-1 items-center gap-4">
          <div className="flex-1">
            <div className="font-semibold">{torrent.name}</div>
            <div className="mt-1.5 flex items-center gap-2">
              <StatusBadge status={torrent.status} />
              <div className="text-xs text-muted-foreground">
                {Math.round(torrent.progress * 100)}% • {torrent.size} • ratio {torrent.ratio.toFixed(2)}
              </div>
            </div>
            <Progress value={torrent.progress * 100} className="mt-2 h-1.5 max-w-xs" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Pause
          </Button>
        </div>
      </div>
    </Card>
  )
}

function StatusBadge({ status }: { status: Torrent['status'] }) {
  const variantMap: Record<Torrent['status'], "default" | "destructive" | "secondary" | "outline"> = {
    downloading: 'default',
    seeding: 'secondary',
    paused: 'outline',
    error: 'destructive',
    checking: 'default',
    completed: 'secondary',
    queued: 'secondary',
  };

  const textMap: Record<Torrent['status'], string> = {
      downloading: 'Downloading',
      seeding: 'Seeding',
      paused: 'Paused',
      error: 'Error',
      checking: 'Checking',
      completed: 'Completed',
      queued: 'Queued',
  };

  return (
      <Badge variant={variantMap[status]}>{textMap[status]}</Badge>
  )
}
