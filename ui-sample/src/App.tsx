import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Button } from './components/ui/button';
import { Sidebar } from './components/Sidebar';
import { TorrentList } from './components/TorrentList';
import { PreferencesPage } from './components/PreferencesPage';

const pageLabels = {
  downloads: 'Downloads',
  preferences: 'Preferences',
  users: 'Users',
};

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [activePage, setActivePage] = useState('downloads');
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Theme management
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleThemeToggle = () => {
    setIsDark(!isDark);
  };

  const renderContent = () => {
    switch (activePage) {
      case 'downloads':
        return <TorrentList isMobile={isMobile} />;
      case 'preferences':
        return <PreferencesPage isMobile={isMobile} />;
      case 'users':
        return (
          <div className="flex-1 p-8 flex items-center justify-center">
            <div className="text-center">
              <h2>Users</h2>
              <p className="caption text-muted-foreground mt-2">
                User management and permissions
              </p>
            </div>
          </div>
        );
      default:
        return <TorrentList isMobile={isMobile} />;
    }
  };

  return (
    <div className="h-screen w-full bg-background text-foreground flex overflow-hidden">
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-30 bg-card/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-center p-4">
            <h3>{pageLabels[activePage] || 'Transmission'}</h3>
          </div>
        </div>
      )}

      {/* Mobile FAB Menu Button */}
      {isMobile && (
        <Button
          className="fixed bottom-6 left-6 z-40 h-12 w-12 rounded-full shadow-lg bg-card/80 backdrop-blur-sm border border-border hover:bg-accent/50 transition-all"
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Sidebar */}
      {!isMobile && (
        <Sidebar
          isDark={isDark}
          onThemeToggle={handleThemeToggle}
          activePage={activePage}
          onPageChange={setActivePage}
          isMobile={isMobile}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <Sidebar
          isDark={isDark}
          onThemeToggle={handleThemeToggle}
          activePage={activePage}
          onPageChange={setActivePage}
          isMobile={isMobile}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${isMobile ? 'pt-16' : ''} min-w-0`}>
        {renderContent()}
      </div>
    </div>
  );
}