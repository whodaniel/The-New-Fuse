import React, { ReactNode, useState } from 'react';
import { Button } from '@the-new-fuse/ui-consolidated';
import { 
  FiMenu, 
  FiHome, 
  FiUsers, 
  FiSettings, 
  FiLayers, 
  FiTool, 
  FiMessageSquare,
  FiDatabase,
  FiActivity,
  FiShield,
  FiX
} from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  const menuItems = [
    { name: 'Dashboard', icon: FiHome, path: '/admin' },
    { name: 'Users', icon: FiUsers, path: '/admin/users' },
    { name: 'Onboarding', icon: FiLayers, path: '/admin/onboarding' },
    { name: 'Tools', icon: FiTool, path: '/admin/tools' },
    { name: 'Agents', icon: FiMessageSquare, path: '/admin/agents' },
    { name: 'Integrations', icon: FiDatabase, path: '/admin/integrations' },
    { name: 'Analytics', icon: FiActivity, path: '/admin/analytics' },
    { name: 'Security', icon: FiShield, path: '/admin/security' },
    { name: 'Settings', icon: FiSettings, path: '/admin/settings' },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile nav header */}
      <div className="flex md:hidden items-center p-4 border-b border-border bg-background">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <FiMenu className="h-4 w-4" />
        </Button>
        <h1 className="ml-4 font-bold text-foreground">Admin Panel</h1>
      </div>
      
      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={closeMobileMenu} />
          <div className="fixed left-0 top-0 h-full w-64 bg-background border-r border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-bold text-foreground">Admin Panel</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeMobileMenu}
                aria-label="Close menu"
              >
                <FiX className="h-4 w-4" />
              </Button>
            </div>
            <nav className="flex flex-col">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link 
                    key={item.path} 
                    to={item.path} 
                    onClick={closeMobileMenu}
                    className={`flex items-center space-x-3 py-3 px-4 transition-colors hover:bg-accent hover:text-accent-foreground ${
                      isActive 
                        ? 'bg-accent text-accent-foreground border-r-2 border-primary' 
                        : 'text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
      
      {/* Desktop layout */}
      <div className="flex">
        {/* Desktop sidebar */}
        <div className="hidden md:block w-64 h-screen bg-background border-r border-border fixed left-0 top-0 overflow-y-auto">
          <div className="p-4 border-b border-border">
            <h1 className="text-lg font-semibold text-foreground">Admin Panel</h1>
          </div>
          
          <nav className="flex flex-col">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  to={item.path}
                  className={`flex items-center space-x-3 py-3 px-4 transition-colors hover:bg-accent hover:text-accent-foreground ${
                    isActive 
                      ? 'bg-accent text-accent-foreground border-r-2 border-primary' 
                      : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        
        {/* Main content */}
        <div className="w-full md:ml-64 p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
