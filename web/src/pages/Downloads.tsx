import { Button } from "@shared/components/ui/button"
import { Input } from "@shared/components/ui/input"
import { DownloadItemCard } from "@/entities/downloads/components/DownloadItemCard"
import { type Torrent } from "@/entities/downloads/model"
import { Plus } from "lucide-react"

const sample: Torrent[] = [
  { id: '1', name: 'Ubuntu 24.04 ISO', status: 'downloading', progress: 0.42, size: '4.2 GB', ratio: 0.8 },
  { id: '2', name: 'Big Buck Bunny 4k', status: 'seeding', progress: 1, size: '650 MB', ratio: 2.1 },
  { id: '3', name: 'Some Archive.zip', status: 'paused', progress: 0.12, size: '1.2 GB', ratio: 0.1 },
]

export default function Downloads() {
  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <h1 className="flex-1 text-xl font-semibold">Downloads</h1>
        <Input
          placeholder="Filter by name..."
          className="max-w-xs"
        />
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add
        </Button>
      </header>

      <div className="space-y-3">
        {sample.map((t) => (
          <DownloadItemCard key={t.id} torrent={t} />
        ))}
      </div>
    </div>
  )
}
