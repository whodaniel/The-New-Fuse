import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, LogOut, X, Zap } from 'lucide-react';
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { SIDEBAR_NAVIGATION, type SidebarNavItem } from '../../config/sidebarNavigation';
import { useAuth } from '../../hooks/useAuth';
import { useAuthorization } from '../../hooks/useAuthorization';

interface PremiumSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

export const PremiumSidebar: React.FC<PremiumSidebarProps> = ({
  isOpen,
  setIsOpen,
  isCollapsed,
  setIsCollapsed,
}) => {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const { hasRole } = useAuthorization();

  const navigation = SIDEBAR_NAVIGATION.filter((item) => {
    if (!item.requiredRoles || item.requiredRoles.length === 0) return true;
    return hasRole(item.requiredRoles);
  });
  const sections: Array<{ key: SidebarNavItem['section']; label: string }> = [
    { key: 'grid', label: 'Grid' },
    { key: 'forge', label: 'Forge' },
    { key: 'nexus', label: 'Nexus' },
    { key: 'apex', label: 'Apex' },
  ];
  const advancedItems = navigation.filter((item) => item.section === 'advanced');
  const hasAdvancedItems = advancedItems.length > 0;
  const isAdvancedRouteActive = advancedItems.some((item) =>
    item.href === '/'
      ? pathname === '/'
      : pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  const [showAdvanced, setShowAdvanced] = React.useState(isAdvancedRouteActive);

  React.useEffect(() => {
    if (isAdvancedRouteActive) setShowAdvanced(true);
  }, [isAdvancedRouteActive]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <div
        className={`fixed top-0 left-0 bottom-0 bg-slate-950/30 backdrop-blur-2xl border-r border-white/10 z-50 transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-20' : 'w-72'}`}
        role="navigation"
      >
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="h-16 flex items-center px-6 border-b border-white/10">
            <div
              className={`flex items-center gap-3 ${isCollapsed ? 'justify-center w-full' : ''}`}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              {!isCollapsed && (
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 whitespace-nowrap">
                  The New Fuse
                </span>
              )}
            </div>
            <button
              className="ml-auto lg:hidden text-gray-400 hover:text-white"
              onClick={() => setIsOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-4">
            {sections.map((section) => {
              const sectionItems = navigation.filter((item) => item.section === section.key);
              if (sectionItems.length === 0) return null;

              return (
                <div key={section.key}>
                  {!isCollapsed && (
                    <div className="px-2 pb-2 text-[11px] tracking-wide uppercase text-gray-500">
                      {section.label}
                    </div>
                  )}
                  <div className="space-y-1">
                    {sectionItems.map((item) => {
                      const isActive =
                        item.href === '/'
                          ? pathname === '/'
                          : pathname === item.href || pathname.startsWith(`${item.href}/`);
                      return (
                        <NavLink
                          key={item.name}
                          to={item.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                            isActive
                              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                              : 'text-gray-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
                          } ${isCollapsed ? 'justify-center' : ''}`}
                          title={isCollapsed ? item.name : undefined}
                          aria-label={isCollapsed ? item.name : undefined}
                        >
                          <item.icon
                            className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`}
                          />
                          {!isCollapsed && (
                            <span className="font-medium whitespace-nowrap">{item.name}</span>
                          )}
                          {isActive && !isCollapsed && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {hasAdvancedItems && !isCollapsed && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced((prev) => !prev)}
                  className="w-full px-2 pb-2 text-[11px] tracking-wide uppercase text-gray-500 flex items-center justify-between hover:text-gray-300 transition-colors"
                  aria-expanded={showAdvanced}
                  aria-controls="advanced-nav-items"
                >
                  <span>Advanced</span>
                  {showAdvanced ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
                {showAdvanced && (
                  <div id="advanced-nav-items" className="space-y-1">
                    {advancedItems.map((item) => {
                      const isActive =
                        item.href === '/'
                          ? pathname === '/'
                          : pathname === item.href || pathname.startsWith(`${item.href}/`);
                      return (
                        <NavLink
                          key={item.name}
                          to={item.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                            isActive
                              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                              : 'text-gray-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
                          }`}
                        >
                          <item.icon
                            className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`}
                          />
                          <span className="font-medium whitespace-nowrap">{item.name}</span>
                          {isActive && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Collapse Toggle */}
          <div className="hidden lg:flex p-4 border-t border-white/10 bg-black/20 justify-end">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors w-full flex justify-center"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* User Profile / Logout */}
          <div className="p-4 border-t border-white/10 bg-black/20">
            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors ${
                isCollapsed ? 'justify-center' : ''
              }`}
              title={isCollapsed ? 'Sign Out' : undefined}
              aria-label={isCollapsed ? 'Sign Out' : undefined}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="font-medium whitespace-nowrap">Sign Out</span>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
