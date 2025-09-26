import { Download, Settings, Sun, Moon, User } from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { cn } from '@shared/lib/utils'

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

          <div className="p-4 border-t border-border/30">
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
    </>
  )
}
