import { Download, Settings, Sun, Moon, User, RefreshCw, LogOut } from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { cn } from '@shared/lib/utils'
import { Badge } from '@shared/components/ui/badge'
import type { SyncControls } from '@shared/contexts/AppShellContext'

type AppPath = '/downloads' | '/preferences'

interface AppSidebarProps {
  isDark: boolean
  onThemeToggle: () => void
  activePath: string
  onNavigate: (path: AppPath) => void
  isMobile: boolean
  isOpen: boolean
  onClose: () => void
  userEmail?: string | null
  userName?: string | null
  syncControls: SyncControls | null
  onLogout?: () => void
}

const menuItems: Array<{ path: AppPath; label: string; icon: typeof Download }> = [
  { path: '/downloads', label: 'Downloads', icon: Download },
  { path: '/preferences', label: 'Preferences', icon: Settings },
]

export function AppSidebar({
  isDark,
  onThemeToggle,
  activePath,
  onNavigate,
  isMobile,
  isOpen,
  onClose,
  userEmail,
  userName,
  syncControls,
  onLogout,
}: AppSidebarProps) {
  const sidebarClasses = cn(
    isMobile
      ? 'fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out'
      : 'w-80',
    isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0',
    'h-screen',
    isMobile ? 'p-4' : 'p-3',
    'flex flex-col'
  )

  const glassClasses = isMobile
    ? 'backdrop-blur-glass mobile-glass-panel'
    : 'backdrop-blur-glass glass-panel'

  return (
    <>
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60"
          onClick={onClose}
        />
      )}
      <div className={sidebarClasses}>
        <div className={cn('h-full flex flex-col rounded-2xl', glassClasses)}>
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent/30 transition-colors">
              <div className="w-11 h-11 rounded-xl bg-emerald-700/15 flex items-center justify-center">
                <User className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="caption truncate">{userName ?? 'Account'}</p>
                <p className="detail text-muted-foreground truncate">{userEmail ?? 'Signed in'}</p>
              </div>
            </div>
            {onLogout && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 w-full justify-center rounded-xl text-sidebar-foreground hover:bg-accent/30"
                onClick={onLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span className="caption">Logout</span>
              </Button>
            )}
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activePath.startsWith(item.path)
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  className={cn(
                    'w-full justify-start h-11 px-4 rounded-xl transition-all',
                    isActive
                      ? 'bg-emerald-700 text-white shadow-md hover:bg-emerald-600'
                      : 'hover:bg-accent/40 text-sidebar-foreground'
                  )}
                  onClick={() => {
                    onNavigate(item.path)
                    if (isMobile) onClose()
                  }}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  <span className="caption">{item.label}</span>
                </Button>
              )
            })}
          </nav>

          <div className="mt-auto border-t border-border/30">
            {syncControls && (
              <div className="space-y-3 border-b border-border/30 p-4">
                {syncControls.statusLabel && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      'w-full justify-center gap-2 rounded-full bg-white/70 text-emerald-700 shadow-sm dark:bg-slate-900/60 dark:text-emerald-300',
                      syncControls.tone === 'error' && 'bg-red-500/15 text-red-600 dark:bg-red-500/20 dark:text-red-300'
                    )}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {syncControls.statusLabel}
                  </Badge>
                )}
                {syncControls.helperText && (
                  <p className="text-xs text-muted-foreground">{syncControls.helperText}</p>
                )}
                {syncControls.onSync && (
                  <Button
                    variant="ghost"
                    className="w-full justify-center rounded-xl border border-white/30 bg-white/40 px-4 py-2 text-sm hover:bg-white/60 dark:border-white/10 dark:bg-slate-900/50 dark:hover:bg-slate-900/70"
                    onClick={syncControls.onSync}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync now
                  </Button>
                )}
              </div>
            )}
            <div className="p-4">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-11 px-4 rounded-xl text-sidebar-foreground hover:bg-accent/40"
                onClick={onThemeToggle}
              >
                {isDark ? <Sun className="mr-3 h-5 w-5" /> : <Moon className="mr-3 h-5 w-5" />}
                <span className="caption">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
