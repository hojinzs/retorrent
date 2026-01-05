import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { Progress } from "@shared/components/ui/progress";
import type { TorrentData } from "../../../components/TorrentItem";

interface TorrentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  torrent: TorrentData | null;
  onAction: (id: string, action: "pause" | "play" | "remove") => void;
}

const statusLabels: Record<TorrentData["status"], string> = {
  downloading: "Downloading",
  seeding: "Seeding",
  paused: "Paused",
  completed: "Completed",
};

const statusToneClasses: Record<TorrentData["status"], string> = {
  downloading: "bg-primary/10 text-primary",
  seeding: "bg-green-500/10 text-green-600",
  paused: "bg-muted text-muted-foreground",
  completed: "bg-green-600/10 text-green-600",
};

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
};

const formatEta = (eta: string) => {
  if (!eta || eta === "∞") return "∞";
  return eta;
};

export function TorrentDetailsDialog({
  open,
  onOpenChange,
  torrent,
  onAction,
}: TorrentDetailsDialogProps) {
  if (!torrent) return null;

  const canPause = torrent.status === "downloading" || torrent.status === "seeding";
  const canResume = torrent.status === "paused";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            {torrent.name}
          </DialogTitle>
          <DialogDescription className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge className={statusToneClasses[torrent.status]}>
              {statusLabels[torrent.status]}
            </Badge>
            <span>Transmission ID: {torrent.transmissionId}</span>
            <span className="hidden sm:inline">•</span>
            <span className="truncate">Hash: {torrent.hash}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Progress</span>
              <span className="text-muted-foreground">{torrent.progress}%</span>
            </div>
            <Progress
              value={torrent.progress}
              className="h-2"
              style={{ "--progress-background": "#16a34a" } as React.CSSProperties}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
              <h4 className="text-sm font-semibold text-foreground">Activity</h4>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Download</dt>
                  <dd className="font-medium text-foreground">{torrent.downloadSpeed}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Upload</dt>
                  <dd className="font-medium text-foreground">{torrent.uploadSpeed}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Ratio</dt>
                  <dd className="font-medium text-foreground">{torrent.ratio.toFixed(2)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">ETA</dt>
                  <dd className="font-medium text-foreground">{formatEta(torrent.eta)}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
              <h4 className="text-sm font-semibold text-foreground">Transfer</h4>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Downloaded</dt>
                  <dd className="font-medium text-foreground">{torrent.downloadedEver}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Uploaded</dt>
                  <dd className="font-medium text-foreground">{torrent.uploadedEver}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Size</dt>
                  <dd className="font-medium text-foreground">{torrent.size}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Total Size</dt>
                  <dd className="font-medium text-foreground">{torrent.totalSize}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
              <h4 className="text-sm font-semibold text-foreground">Dates</h4>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Added</dt>
                  <dd className="font-medium text-foreground">{formatDateTime(torrent.addedDate)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Completed</dt>
                  <dd className="font-medium text-foreground">{formatDateTime(torrent.doneDate)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-medium text-foreground">{torrent.rawStatus}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
              <h4 className="text-sm font-semibold text-foreground">Identifiers</h4>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Transmission ID</dt>
                  <dd className="font-medium text-foreground">{torrent.transmissionId}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Hash</dt>
                  <dd className="font-medium text-foreground break-all text-right">{torrent.hash}</dd>
                </div>
              </dl>
            </div>
          </div>

          {torrent.errorString && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              <p className="font-semibold">Error</p>
              <p className="mt-2">{torrent.errorString}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-wrap gap-2">
          {canPause && (
            <Button variant="outline" onClick={() => onAction(torrent.id, "pause")}>
              Pause
            </Button>
          )}
          {canResume && (
            <Button variant="outline" onClick={() => onAction(torrent.id, "play")}>
              Resume
            </Button>
          )}
          <Button variant="destructive" onClick={() => onAction(torrent.id, "remove")}>
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
