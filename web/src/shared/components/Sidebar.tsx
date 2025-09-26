import { Download, Settings, Users, Sun, Moon, User } from "lucide-react";
import { Button } from "./ui/button";

interface SidebarProps {
  isDark: boolean;
  onThemeToggle: () => void;
  activePage: string;
  onPageChange: (page: string) => void;
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { id: 'downloads', label: 'Downloads', icon: Download },
  { id: 'preferences', label: 'Preferences', icon: Settings },
  { id: 'users', label: 'Users', icon: Users },
];

export function Sidebar({ isDark, onThemeToggle, activePage, onPageChange, isMobile, isOpen, onClose }: SidebarProps) {
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
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
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
              const isActive = activePage === item.id;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={`
                    w-full justify-start h-11 px-4 rounded-lg transition-all
                    ${isActive 
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                      : 'hover:bg-accent/50 text-sidebar-foreground'
                    }
                  `}
                  onClick={() => {
                    onPageChange(item.id);
                    if (isMobile) onClose();
                  }}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  <span className="caption">{item.label}</span>
                </Button>
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