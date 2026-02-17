import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SIDEBAR_NAVIGATION } from '../../../config/sidebarNavigation';
import { useLayout } from '../../../contexts/LayoutContext';
import { useAuthorization } from '../../../hooks/useAuthorization';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className = '' }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { layout, toggleSidebar } = useLayout();
  const { hasRole } = useAuthorization();

  const navigation = SIDEBAR_NAVIGATION.filter((item) => {
    if (!item.requiredRoles || item.requiredRoles.length === 0) return true;
    return hasRole(item.requiredRoles);
  });

  return (
    <div className={`border-r bg-card flex flex-col ${className}`}>
      <div className="p-4 border-b">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mb-2">
          <Menu className="h-4 w-4" />
        </Button>
      </div>
      <nav className="flex-1">
        <div className="px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? location.pathname === '/'
                : location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
            return (
              <Button
                key={item.name}
                variant={isActive ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => navigate(item.href)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {layout.sidebarOpen && <span>{item.name}</span>}
              </Button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
