import { useState, useCallback, useMemo, useEffect } from "react"
import { Button } from "@shared/components/ui/button"
import { Checkbox } from "@shared/components/ui/checkbox"
import { useTorrents } from "../entities/downloads/hooks/useTorrents"
import { DownloadItemCard } from "../entities/downloads/components/DownloadItemCard"
import { TorrentAddDialog } from "../entities/downloads/components/TorrentAddDialog"
import { TorrentRemoveDialog } from "../entities/downloads/components/TorrentRemoveDialog"
import { RefreshCw, Wifi, WifiOff, Trash2, CheckSquare, Square } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@shared/components/ui/tabs"
import { useAppShell } from "@shared/contexts/AppShellContext"
import { cn } from "@shared/lib/utils"
import type { Torrent } from "../entities/downloads/model"

type TorrentFilterKey =
  | "all"
  | "active"
  | "downloading"
  | "seeding"
  | "checking"
  | "paused"
  | "finished"

const TORRENT_FILTERS: Array<{
  key: TorrentFilterKey
  label: string
  predicate: (torrent: Torrent) => boolean
  hideOnMobile?: boolean
}> = [
  {
    key: "all",
    label: "All",
    predicate: () => true,
  },
  {
    key: "active",
    label: "Active",
    predicate: (torrent) => torrent.status === "download" || torrent.status === "seed",
    hideOnMobile: true,
  },
  {
    key: "downloading",
    label: "Downloading",
    predicate: (torrent) => torrent.status === "download" || torrent.status === "downloadWait",
  },
  {
    key: "seeding",
    label: "Seeding",
    predicate: (torrent) => torrent.status === "seed" || torrent.status === "seedWait",
    hideOnMobile: true,
  },
  {
    key: "checking",
    label: "Checking",
    predicate: (torrent) => torrent.status === "check" || torrent.status === "checkWait",
    hideOnMobile: true,
  },
  {
    key: "paused",
    label: "Paused",
    predicate: (torrent) => torrent.status === "stopped",
    hideOnMobile: true,
  },
  {
    key: "finished",
    label: "Finished",
    predicate: (torrent) => torrent.percentDone >= 1 && torrent.status !== "download" && torrent.status !== "downloadWait",
  },
]

export function DownloadsPage() {
  const { torrents, isLoading, error, forceSync, controlTorrent, addTorrent, removeTorrents } = useTorrents()
  const { registerSyncControls, isMobile } = useAppShell()
  const [activeTab, setActiveTab] = useState<TorrentFilterKey>("all")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [showSelection, setShowSelection] = useState(false)
  const [removeTargets, setRemoveTargets] = useState<typeof torrents>([])

  useEffect(() => {
    registerSyncControls({
      onSync: forceSync,
      statusLabel: error ? "Sync issue" : "Live sync",
      helperText: error ?? "Manual sync fetches the latest data from Transmission.",
      tone: error ? "error" : "online",
    })
    return () => registerSyncControls(null)
  }, [error, forceSync, registerSyncControls])

  const filterCounts = useMemo(() => {
    const counts = {} as Record<TorrentFilterKey, number>
    for (const filter of TORRENT_FILTERS) {
      counts[filter.key] = filter.key === "all" ? torrents.length : torrents.filter(filter.predicate).length
    }
    return counts
  }, [torrents])

  const filteredTorrents = useMemo(() => {
    const filter = TORRENT_FILTERS.find((item) => item.key === activeTab)
    return filter ? torrents.filter(filter.predicate) : torrents
  }, [activeTab, torrents])

  const displayedSelectedTorrents = useMemo(
    () => filteredTorrents.filter((torrent) => selectedIds.has(torrent.id)),
    [filteredTorrents, selectedIds]
  )
  const totalSelected = selectedIds.size
  const displayedSelectedCount = displayedSelectedTorrents.length
  const allSelected = filteredTorrents.length > 0 && displayedSelectedCount === filteredTorrents.length
  const someDisplayedSelected = displayedSelectedCount > 0

  const handleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        filteredTorrents.forEach((torrent) => next.delete(torrent.id))
      } else {
        filteredTorrents.forEach((torrent) => next.add(torrent.id))
      }
      return next
    })
  }, [allSelected, filteredTorrents])

  const handleSelectTorrent = useCallback((torrentId: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (selected) {
        next.add(torrentId)
      } else {
        next.delete(torrentId)
      }
      return next
    })
  }, [])

  const handleRemoveSelected = useCallback(() => {
    if (displayedSelectedTorrents.length > 0) {
      setRemoveTargets(displayedSelectedTorrents)
      setShowRemoveDialog(true)
    }
  }, [displayedSelectedTorrents])

  const handleRemoveConfirm = useCallback(async (ids: number[], deleteLocalData: boolean) => {
    await removeTorrents(ids, deleteLocalData)
    setSelectedIds(new Set())
    setRemoveTargets([])
    setShowRemoveDialog(false)
  }, [removeTorrents])

  const toggleSelectionMode = useCallback(() => {
    setShowSelection((prev) => {
      if (prev) {
        setSelectedIds(new Set())
      }
      return !prev
    })
  }, [])

  const handleControl = useCallback(async (id: string, action: "start" | "stop" | "remove") => {
    if (action === "remove") {
      const target = torrents.find((t) => t.id === id)
      if (target) {
        setRemoveTargets([target])
        setShowRemoveDialog(true)
      }
      return
    }
    await controlTorrent(id, action)
  }, [controlTorrent, torrents])

  const renderEmptyState = () => (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-700/10 text-emerald-700 dark:text-emerald-300">
        <Wifi className="h-8 w-8" />
      </div>
      <h3 className="mt-6 text-xl font-semibold text-slate-800 dark:text-white">No torrents found</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Add a torrent to get started or use the sync controls in the sidebar.
      </p>
      <div className="mt-6 flex justify-center">
        <TorrentAddDialog
          onAddTorrent={addTorrent}
          triggerProps={{ className: "rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg shadow-emerald-700/25" }}
        />
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <div className="backdrop-blur-glass glass-panel rounded-3xl border border-white/30 px-10 py-14 text-center shadow-xl dark:border-white/10">
          <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-muted-foreground">Loading torrents…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <div className="backdrop-blur-glass glass-panel max-w-md rounded-3xl border border-white/30 px-8 py-10 text-center shadow-xl dark:border-white/10">
          <WifiOff className="mx-auto mb-4 h-10 w-10 text-red-500" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Connection issue</h3>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button onClick={forceSync} className="mt-6 rounded-xl bg-emerald-700 text-white hover:bg-emerald-600">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 pb-6">
      <div className="backdrop-blur-glass glass-panel overflow-hidden rounded-3xl border border-white/30 shadow-[0_40px_120px_-45px_rgba(15,23,42,0.45)] dark:border-white/10">
        <div className="border-b border-white/20 px-6 py-6 dark:border-white/10">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <h2 className="text-3xl font-semibold text-slate-800 dark:text-white">Downloads</h2>
                <p className="caption text-muted-foreground">Real-time overview of your Transmission torrents.</p>
              </div>
              <div className="hidden items-center gap-3 lg:flex">
                <TorrentAddDialog
                  onAddTorrent={addTorrent}
                  triggerProps={{ className: "rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg shadow-emerald-700/25" }}
                />
              </div>
            </div>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TorrentFilterKey)} className="w-full">
              <TabsList className="grid h-auto w-full grid-cols-3 gap-2 rounded-2xl bg-white/50 p-1 text-xs font-medium backdrop-blur-xl dark:bg-slate-900/40 lg:flex lg:w-auto lg:flex-wrap lg:gap-2 lg:rounded-full lg:px-1.5 lg:py-1.5 lg:text-sm">
                {TORRENT_FILTERS.map((filter) => (
                  <TabsTrigger
                    key={filter.key}
                    value={filter.key}
                    className={cn(
                      "inline-flex items-center justify-center rounded-xl px-2 py-2 transition-all data-[state=active]:bg-white data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-slate-900/80 dark:data-[state=active]:text-emerald-300 lg:px-3 lg:py-1.5",
                      filter.hideOnMobile ? "hidden lg:inline-flex" : "inline-flex"
                    )}
                  >
                    <span>{filter.label}</span>
                    <span className="ml-1 text-[11px] text-muted-foreground lg:ml-2 lg:text-xs">
                      {filterCounts[filter.key] ?? 0}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="flex flex-col">
          {torrents.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              {filteredTorrents.length > 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/20 px-6 py-4 dark:border-white/10">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl bg-white/50 px-3 py-2 text-sm hover:bg-white/70 dark:bg-slate-900/60 dark:hover:bg-slate-900/80"
                      onClick={toggleSelectionMode}
                    >
                      {showSelection ? <Square className="mr-2 h-4 w-4" /> : <CheckSquare className="mr-2 h-4 w-4" />}
                      {showSelection ? "Cancel selection" : "Select torrents"}
                    </Button>
                    {showSelection && (
                      <div className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/60 px-3 py-1.5 text-xs dark:border-white/10 dark:bg-slate-900/50">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all torrents in view"
                        />
                        <span className="text-muted-foreground">
                          {someDisplayedSelected ? `${displayedSelectedCount} selected` : "Select all"}
                        </span>
                      </div>
                    )}
                  </div>

                  {showSelection && someDisplayedSelected && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="rounded-xl px-4 py-2 text-sm"
                      onClick={handleRemoveSelected}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove selected ({displayedSelectedCount})
                    </Button>
                  )}
                </div>
              ) : (
                <div className="border-b border-white/20 px-6 py-12 text-center text-sm text-muted-foreground dark:border-white/10">
                  No torrents in this state yet.
                </div>
              )}

              {filteredTorrents.length > 0 && (
                <div className="divide-y divide-white/15 dark:divide-white/10">
                  {filteredTorrents.map((torrent) => (
                    <DownloadItemCard
                      key={torrent.id}
                      torrent={torrent}
                      onControl={handleControl}
                      isSelected={selectedIds.has(torrent.id)}
                      onSelectionChange={(selected) => handleSelectTorrent(torrent.id, selected)}
                      showSelection={showSelection}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="pb-6 text-center text-sm text-muted-foreground">
        Showing {filteredTorrents.length} of {torrents.length} torrent{torrents.length !== 1 ? "s" : ""}
        {totalSelected > 0 && ` • ${totalSelected} selected`}
      </div>

      <TorrentRemoveDialog
        open={showRemoveDialog}
        onOpenChange={(open) => {
          setShowRemoveDialog(open)
          if (!open) setRemoveTargets([])
        }}
        torrents={removeTargets}
        onRemove={handleRemoveConfirm}
      />

      {isMobile && (
        <TorrentAddDialog
          onAddTorrent={addTorrent}
          iconOnly
          triggerLabel="Add torrent"
          triggerProps={{
            size: "icon",
            className: "fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-emerald-700 text-white shadow-xl shadow-emerald-700/30 hover:bg-emerald-600 focus-visible:ring-emerald-400",
          }}
        />
      )}
    </div>
  )
}
