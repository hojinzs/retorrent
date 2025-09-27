import React from "react";
import { Progress } from "@shared/components/ui/progress";
import { Button } from "@shared/components/ui/button";
import { Pause, Play, Trash2 } from "lucide-react";
import { useIsMobile } from "@shared/hooks/use-mobile";
import { Checkbox } from "@shared/components/ui/checkbox";

export interface TorrentData {
  id: string;
  name: string;
  progress: number;
  downloadSpeed: string;
  uploadSpeed: string;
  size: string;
  status: 'downloading' | 'seeding' | 'paused' | 'completed';
  eta: string;
}

interface TorrentItemProps {
  torrent: TorrentData;
  onAction: (id: string, action: 'play' | 'pause' | 'remove') => void;
  showSelectionCheckbox?: boolean;
  selectionMode?: boolean;
  selected?: boolean;
  onSelectChange?: (checked: boolean) => void;
}

const ACTION_BUTTON_WIDTH = 88;
const TOTAL_ACTION_WIDTH = ACTION_BUTTON_WIDTH * 3;
const SELECTION_WIDTH = 72;

type IconType = typeof Pause;

export function TorrentItem({
  torrent,
  onAction,
  showSelectionCheckbox = false,
  selectionMode = false,
  selected = false,
  onSelectChange,
}: TorrentItemProps) {
  const isMobile = useIsMobile();
  const [translateX, setTranslateX] = React.useState(0);
  const [isOpen, setIsOpen] = React.useState(false);
  const dragState = React.useRef<{ startX: number; startTranslate: number } | null>(null);

  const selectionOffset = React.useMemo(() => {
    if (!isMobile) return 0;
    return selectionMode && showSelectionCheckbox ? SELECTION_WIDTH : 0;
  }, [isMobile, selectionMode, showSelectionCheckbox]);

  React.useEffect(() => {
    if (!isMobile) {
      setTranslateX(0);
      setIsOpen(false);
      dragState.current = null;
    }
  }, [isMobile]);

  React.useEffect(() => {
    if (isMobile) {
      setTranslateX(selectionOffset);
      if (!selectionMode) {
        setIsOpen(false);
      }
    }
  }, [isMobile, selectionOffset, selectionMode]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'downloading':
        return 'text-primary';
      case 'seeding':
        return 'text-green-500';
      case 'paused':
        return 'text-muted-foreground';
      case 'completed':
        return 'text-green-600';
      default:
        return 'text-foreground';
    }
  };

  const canPause = torrent.status === 'downloading' || torrent.status === 'seeding';
  const canResume = torrent.status === 'paused';

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  const closeActions = () => {
    if (isMobile) {
      setIsOpen(false);
      setTranslateX(selectionOffset);
      dragState.current = null;
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile) return;

    const touchX = event.touches[0]?.clientX;
    if (touchX == null) return;

    dragState.current = {
      startX: touchX,
      startTranslate: translateX,
    };
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile || !dragState.current) return;

    const touchX = event.touches[0]?.clientX;
    if (touchX == null) return;

    const delta = touchX - dragState.current.startX;
    const minTranslate = selectionOffset - TOTAL_ACTION_WIDTH;
    const maxTranslate = selectionOffset;
    const next = clamp(dragState.current.startTranslate + delta, minTranslate, maxTranslate);

    if (Math.abs(delta) > 8) {
      event.preventDefault();
    }

    setTranslateX(next);
  };

  const handleTouchEnd = () => {
    if (!isMobile || !dragState.current) return;

    const openThreshold = selectionOffset - TOTAL_ACTION_WIDTH * 0.5;
    const shouldOpen = translateX <= openThreshold;
    setIsOpen(shouldOpen);
    setTranslateX(shouldOpen ? selectionOffset - TOTAL_ACTION_WIDTH : selectionOffset);
    dragState.current = null;
  };

  const handleAction = (action: 'pause' | 'play' | 'remove') => {
    onAction(torrent.id, action);
    closeActions();
  };

  const handleSelectionChange = (checked: boolean) => {
    onSelectChange?.(checked);
  };

  const renderActionButton = (
    action: 'pause' | 'play' | 'remove',
    {
      label,
      icon: Icon,
      tone,
      disabled,
    }: { label: string; icon: IconType; tone: 'default' | 'destructive'; disabled?: boolean },
    layout: 'mobile' | 'desktop',
  ) => {
    if (layout === 'mobile') {
      const toneClasses = tone === 'destructive'
        ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
        : 'bg-primary/90 text-primary-foreground hover:bg-primary';

      return (
        <Button
          key={`${layout}-${action}`}
          variant="ghost"
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            handleAction(action);
          }}
          className={`h-full rounded-none border-l border-border/40 px-0 first:border-l-0 ${toneClasses}`}
          style={{ width: ACTION_BUTTON_WIDTH }}
        >
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs font-medium">
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </div>
        </Button>
      );
    }

    return (
      <Button
        key={`${layout}-${action}`}
        variant={tone === 'destructive' ? 'destructive' : 'secondary'}
        disabled={disabled}
        onClick={() => handleAction(action)}
        className="flex w-full items-center justify-start gap-2"
      >
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{label}</span>
      </Button>
    );
  };

  const actionButtons = [
    renderActionButton('pause', {
      label: 'Pause',
      icon: Pause,
      tone: 'default',
      disabled: !canPause,
    }, isMobile ? 'mobile' : 'desktop'),
    renderActionButton('play', {
      label: 'Resume',
      icon: Play,
      tone: 'default',
      disabled: !canResume,
    }, isMobile ? 'mobile' : 'desktop'),
    renderActionButton('remove', {
      label: 'Delete',
      icon: Trash2,
      tone: 'destructive',
    }, isMobile ? 'mobile' : 'desktop'),
  ];

  const content = (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-foreground">{torrent.name}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-4 text-sm">
          <span className={`${getStatusColor(torrent.status)} font-medium`}>
            {torrent.status.charAt(0).toUpperCase() + torrent.status.slice(1)}
          </span>
          <span className="font-medium text-muted-foreground">{torrent.size}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Progress
            value={torrent.progress}
            className="h-2"
            style={{
              '--progress-background': '#16a34a',
            } as React.CSSProperties}
          />
        </div>
        <span className="w-12 text-right text-sm font-medium text-muted-foreground">{torrent.progress}%</span>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>↓ {torrent.downloadSpeed}</span>
          <span>↑ {torrent.uploadSpeed}</span>
          <span>Ratio: 0.0</span>
        </div>
        <span>ETA: {torrent.eta}</span>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="relative mb-3 last:mb-0">
        {showSelectionCheckbox && (
          <div
            className="absolute inset-y-0 left-0 flex items-center justify-center"
            style={{ width: SELECTION_WIDTH }}
          >
            <div className="flex h-full w-full items-center justify-center rounded-l-2xl bg-muted">
              <Checkbox
                checked={selected}
                onCheckedChange={(value) => handleSelectionChange(!!value)}
                className="h-6 w-6"
                aria-label="Select torrent"
              />
            </div>
          </div>
        )}
        <div
          className="absolute inset-y-0 right-0 flex overflow-hidden"
          style={{ width: TOTAL_ACTION_WIDTH }}
        >
          {actionButtons}
        </div>
        <div
          className="relative z-10 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-transform duration-200 ease-out"
          style={{ transform: `translateX(${translateX}px)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onClick={() => {
            if (isOpen) {
              closeActions();
            }
          }}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3 last:mb-0 rounded-2xl border border-border/60 bg-card shadow-sm transition-colors hover:bg-card/80">
      <div className="flex items-start gap-4 p-4">
        {showSelectionCheckbox && (
          <div className="pt-1">
            <Checkbox
              checked={selected}
              onCheckedChange={(value) => handleSelectionChange(!!value)}
              aria-label="Select torrent"
            />
          </div>
        )}
        <div className="flex w-44 shrink-0 flex-col gap-2">
          {actionButtons}
        </div>
        <div className="flex-1 cursor-pointer">
          {content}
        </div>
      </div>
    </div>
  );
}
