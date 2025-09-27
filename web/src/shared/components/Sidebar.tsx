import { Download, Settings, Users, Sun, Moon, User } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "@tanstack/react-router";

interface SidebarProps {
  isDark: boolean;
  onThemeToggle: () => void;
  activePath: string;
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { id: 'downloads', label: 'Downloads', icon: Download, path: '/downloads', disabled: false },
  { id: 'preferences', label: 'Preferences', icon: Settings, path: '/preferences', disabled: false },
  { id: 'users', label: 'Users', icon: Users, path: '/users', disabled: true },
];

export function Sidebar({ isDark, onThemeToggle, activePath, isMobile, isOpen, onClose }: SidebarProps) {
  const sidebarClasses = `
    ${isMobile ? 'fixed inset-y-0 -left-80 z-50 w-80 transform transition-transform duration-300 ease-in-out' : 'w-80'}
    ${isMobile && isOpen && 'translate-x-full'}
    h-full ${isMobile ? 'p-4' : 'p-4 pr-0'} flex flex-col
  `;

  const glassClasses = "backdrop-blur-2xl bg-white/50 dark:bg-neutral-600/10 border border-neutral-200/50 dark:border-neutral-500/50"
  const shadowClasses = "shadow-md dark:shadow-none"

  return (
    <>
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-white/50 dark:bg-black/50 z-40"
          onClick={onClose}
        />
      )}
      <div className={sidebarClasses}>
        <div className={`h-full flex flex-col ${glassClasses} ${shadowClasses} rounded-xl`}>
          {/* User Profile Section - Now at top */}
          <div className="p-4 border-b border-border/20">
            <div className="flex items-center gap-3 p-2 rounded-lg dark:hover:bg-black/10 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="caption truncate">Admin User</p>
                <p className="detail text-muted-foreground">admin@transmission</p>
              </div>
            </div>
          </div>
          
          {/* Navigation Menu */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePath === item.path;
              return (
                <Link key={item.id} to={item.path} onClick={isMobile ? onClose : undefined}>
                  <Button
                    variant="ghost"
                    className={`
                      w-full justify-start h-12 px-4 rounded-lg transition-all hover:bg-black/10 dark:hover:bg-black/10
                      ${isActive 
                        ? 'text-green-600 hover:text-green-600' 
                        : 'text-sidebar-foreground'}
                      ${item.disabled 
                        ? 'cursor-not-allowed opacity-50'
                        : ''}
                    `}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    <span className="caption">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>
          
          {/* Theme Toggle - Bottom */}
          <div className="p-4 border-t border-border/20">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-11 px-4 rounded-lg text-sidebar-foreground hover:bg-accent/30"
              onClick={onThemeToggle}
            >
              {isDark ? <Sun className="mr-3 h-5 w-5" /> : <Moon className="mr-3 h-5 w-5" />}
              <span className="caption">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}