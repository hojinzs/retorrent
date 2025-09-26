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
  { id: 'downloads', label: 'Downloads', icon: Download, path: '/downloads' },
  { id: 'preferences', label: 'Preferences', icon: Settings, path: '/preferences' },
  { id: 'users', label: 'Users', icon: Users, path: '/users' },
];

export function Sidebar({ isDark, onThemeToggle, activePath, isMobile, isOpen, onClose }: SidebarProps) {
  const sidebarClasses = `
    ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out' : 'w-80'}
    ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}
    h-screen ${isMobile ? 'p-4' : 'p-3'} flex flex-col
  `;

  const glassClasses = isMobile 
    ? 'backdrop-blur-glass mobile-glass-panel' 
    : 'backdrop-blur-glass glass-panel';

  return (
    <>
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40"
          onClick={onClose}
        />
      )}
      <div className={sidebarClasses}>
        <div className={`h-full flex flex-col ${glassClasses} rounded-xl`}>
          {/* User Profile Section - Now at top */}
          <div className="p-4 border-b border-border/20">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/30 transition-colors cursor-pointer">
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
              
              if (item.id === 'users') {
                // Users page not implemented yet, show as disabled
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    disabled
                    className={`
                      w-full justify-start h-11 px-4 rounded-lg transition-all opacity-50 cursor-not-allowed
                      text-sidebar-foreground
                    `}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    <span className="caption">{item.label}</span>
                  </Button>
                );
              }
              
              return (
                <Link key={item.id} to={item.path} onClick={isMobile ? onClose : undefined}>
                  <Button
                    variant="ghost"
                    className={`
                      w-full justify-start h-11 px-4 rounded-lg transition-all
                      ${isActive 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'hover:bg-accent/50 text-sidebar-foreground'
                      }
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