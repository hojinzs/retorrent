import { Badge } from "@shared/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@shared/components/ui/dialog"
import { Progress } from "@shared/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs"
import { formatBytes } from "@shared/lib/utils"
import type { Torrent, TorrentStatus } from "../model"

const statusLabelMap: Record<TorrentStatus, string> = {
  stopped: "Stopped",
  checkWait: "Check Wait",
  check: "Checking",
  downloadWait: "Download Wait",
  download: "Downloading",
  seedWait: "Seed Wait",
  seed: "Seeding",
  removed: "Removed",
}

const statusVariantMap: Record<TorrentStatus, "default" | "destructive" | "secondary" | "outline"> = {
  stopped: "outline",
  checkWait: "secondary",
  check: "default",
  downloadWait: "secondary",
  download: "default",
  seedWait: "secondary",
  seed: "secondary",
  removed: "destructive",
}

const formatEta = (eta: number) => {
  if (!Number.isFinite(eta) || eta <= 0) {
    return "∞"
  }

  const hours = Math.floor(eta / 3600)
  const minutes = Math.floor((eta % 3600) / 60)
  const seconds = Math.floor(eta % 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }

  return `${seconds}s`
}

const formatDate = (value?: string) => {
  if (!value) {
    return "—"
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString()
}

type TransmissionFile = {
  name?: string
  length?: number
  bytesCompleted?: number
}

type TransmissionPeer = {
  address?: string
  clientName?: string
  progress?: number
  rateToClient?: number
  rateToPeer?: number
}

type TransmissionTracker = {
  announce?: string
  scrape?: string
  tier?: number
}

type TransmissionTrackerStat = {
  host?: string
  lastAnnounceResult?: string
  lastAnnounceTime?: number
  leecherCount?: number
  seederCount?: number
}

type TransmissionTrackerEntry = TransmissionTracker | TransmissionTrackerStat

type TransmissionData = {
  downloadDir?: string
  creator?: string
  comment?: string
  isPrivate?: boolean
  pieceCount?: number
  pieceSize?: number
  metadataPercentComplete?: number
  files?: TransmissionFile[]
  peers?: TransmissionPeer[]
  trackers?: TransmissionTracker[]
  trackerStats?: TransmissionTrackerStat[]
}

const statRowClass = "grid grid-cols-1 gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm md:grid-cols-2"

const StatItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right font-medium text-foreground">{value}</span>
  </div>
)

const isTrackerStat = (tracker: TransmissionTrackerEntry): tracker is TransmissionTrackerStat => {
  return "host" in tracker
}

interface TorrentDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  torrent: Torrent | null
}

export function TorrentDetailsDialog({ open, onOpenChange, torrent }: TorrentDetailsDialogProps) {
  if (!torrent) {
    return null
  }

  const progressPercent = Math.round(torrent.percentDone * 100)
  const transmission = torrent.transmissionData as TransmissionData | undefined
  const files = transmission?.files ?? []
  const peers = transmission?.peers ?? []
  const trackers: TransmissionTrackerEntry[] = transmission?.trackerStats ?? transmission?.trackers ?? []

  const remainingBytes = Math.max(0, torrent.sizeWhenDone - torrent.downloadedEver)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col gap-2">
            <DialogTitle className="text-lg font-semibold">{torrent.name}</DialogTitle>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Badge variant={statusVariantMap[torrent.status]}>{statusLabelMap[torrent.status]}</Badge>
              <span className="text-muted-foreground">{formatBytes(torrent.sizeWhenDone)}</span>
              <span className="text-muted-foreground">ETA {formatEta(torrent.eta)}</span>
              <span className="text-muted-foreground">Ratio {torrent.uploadRatio.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={progressPercent} className="h-2 flex-1" />
              <span className="text-xs font-medium text-muted-foreground">{progressPercent}%</span>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="peers">Peers</TabsTrigger>
            <TabsTrigger value="trackers">Trackers</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-3">
            <div className={statRowClass}>
              <StatItem label="Downloaded" value={formatBytes(torrent.downloadedEver)} />
              <StatItem label="Uploaded" value={formatBytes(torrent.uploadedEver)} />
              <StatItem label="Download Speed" value={`${formatBytes(torrent.rateDownload)}/s`} />
              <StatItem label="Upload Speed" value={`${formatBytes(torrent.rateUpload)}/s`} />
            </div>
            <div className={statRowClass}>
              <StatItem label="Total Size" value={formatBytes(torrent.totalSize || torrent.sizeWhenDone)} />
              <StatItem label="Remaining" value={formatBytes(remainingBytes)} />
              <StatItem label="ETA" value={formatEta(torrent.eta)} />
              <StatItem label="Percent Done" value={`${progressPercent}%`} />
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-4 space-y-3">
            <div className={statRowClass}>
              <StatItem label="Added" value={formatDate(torrent.addedDate)} />
              <StatItem label="Completed" value={formatDate(torrent.doneDate)} />
              <StatItem label="Last Updated" value={formatDate(torrent.updated)} />
              <StatItem label="Download Ratio" value={torrent.uploadRatio.toFixed(2)} />
            </div>
            {torrent.errorString ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {torrent.errorString}
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="details" className="mt-4 space-y-3">
            <div className={statRowClass}>
              <StatItem label="Transmission ID" value={torrent.transmissionId.toString()} />
              <StatItem label="Hash" value={torrent.hash} />
              <StatItem label="Download Directory" value={transmission?.downloadDir || "—"} />
              <StatItem label="Private" value={transmission?.isPrivate ? "Yes" : "No"} />
            </div>
            <div className={statRowClass}>
              <StatItem label="Creator" value={transmission?.creator || "—"} />
              <StatItem label="Comment" value={transmission?.comment || "—"} />
              <StatItem label="Piece Count" value={transmission?.pieceCount ? transmission.pieceCount.toString() : "—"} />
              <StatItem label="Piece Size" value={transmission?.pieceSize ? formatBytes(transmission.pieceSize) : "—"} />
            </div>
          </TabsContent>

          <TabsContent value="files" className="mt-4 space-y-3">
            {files.length === 0 ? (
              <p className="text-sm text-muted-foreground">No file data available from Transmission.</p>
            ) : (
              <div className="space-y-3">
                {files.map((file, index) => {
                  const fileLength = file.length ?? 0
                  const completed = file.bytesCompleted ?? 0
                  const percent = fileLength > 0 ? Math.round((completed / fileLength) * 100) : 0

                  return (
                    <div key={`${file.name ?? "file"}-${index}`} className="rounded-lg border border-border/60 p-3">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-foreground">{file.name ?? `File ${index + 1}`}</span>
                        <span className="text-muted-foreground">{percent}%</span>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <Progress value={percent} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground">
                          {formatBytes(completed)} / {formatBytes(fileLength)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="peers" className="mt-4 space-y-3">
            {peers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No peer data available from Transmission.</p>
            ) : (
              <div className="space-y-3">
                {peers.map((peer, index) => (
                  <div key={`${peer.address ?? "peer"}-${index}`} className="rounded-lg border border-border/60 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-foreground">{peer.address ?? "Unknown"}</span>
                      <span className="text-muted-foreground">{peer.clientName ?? "Unknown client"}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-muted-foreground md:grid-cols-3">
                      <span>Progress: {peer.progress != null ? `${Math.round(peer.progress * 100)}%` : "—"}</span>
                      <span>↓ {peer.rateToClient != null ? `${formatBytes(peer.rateToClient)}/s` : "—"}</span>
                      <span>↑ {peer.rateToPeer != null ? `${formatBytes(peer.rateToPeer)}/s` : "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="trackers" className="mt-4 space-y-3">
            {trackers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tracker data available from Transmission.</p>
            ) : (
              <div className="space-y-3">
                {trackers.map((tracker, index) => (
                  <div
                    key={`${isTrackerStat(tracker) ? tracker.host : tracker.announce}-${index}`}
                    className="rounded-lg border border-border/60 p-3 text-sm"
                  >
                    {isTrackerStat(tracker) ? (
                      <>
                        <div className="font-medium text-foreground">{tracker.host ?? "Unknown tracker"}</div>
                        <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-muted-foreground md:grid-cols-3">
                          <span>Seeders: {tracker.seederCount ?? "—"}</span>
                          <span>Leechers: {tracker.leecherCount ?? "—"}</span>
                          <span>Last announce: {tracker.lastAnnounceResult ?? "—"}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-medium text-foreground">{tracker.announce ?? "Unknown tracker"}</div>
                        <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-muted-foreground md:grid-cols-2">
                          <span>Scrape: {tracker.scrape ?? "—"}</span>
                          <span>Tier: {tracker.tier ?? "—"}</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
