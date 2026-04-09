import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, LogOut, X, Zap } from 'lucide-react';
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  SIDEBAR_NAVIGATION,
  SIDEBAR_SECTION_GROUPS,
  type SidebarNavItem,
} from '../../config/sidebarNavigation';
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
  const { logout, isAuthenticated } = useAuth();
  const { hasRole } = useAuthorization();

  const navigation = SIDEBAR_NAVIGATION.filter((item) => {
    if (!item.requiredRoles || item.requiredRoles.length === 0) return true;
    return hasRole(item.requiredRoles);
  });
  const sections: Array<{ key: SidebarNavItem['section']; label: string }> = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'workspace', label: 'Workspace' },
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

  React.useEffect(() => {
    setOpenGroups((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const group of groupedNavigation) {
        const groupHasActiveRoute = group.items.some(isItemRouteActive);
        if (groupHasActiveRoute && !next[group.id]) {
          next[group.id] = true;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [groupedNavigation, isItemRouteActive]);

  React.useEffect(() => {
    setOpenItems((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const item of navigation) {
        if (!item.children || item.children.length === 0) {
          continue;
        }

        if (isItemRouteActive(item) && next[item.name] !== true) {
          next[item.name] = true;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [isItemRouteActive, navigation]);

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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <div
        className={`fixed top-0 left-0 bottom-0 bg-slate-950 border-r border-slate-800 z-50 transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-16' : 'w-64'}`}
        role="navigation"
      >
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="h-14 flex items-center px-4 border-b border-slate-800">
            <div
              className={`flex items-center gap-3 ${isCollapsed ? 'justify-center w-full' : ''}`}
            >
              <div className="w-7 h-7 rounded-md bg-slate-800 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              {!isCollapsed && (
                <span className="text-base font-semibold text-slate-100 whitespace-nowrap">
                  The New Fuse
                </span>
              )}
            </div>
            <button
              className="ml-auto md:hidden text-gray-400 hover:text-white"
              onClick={() => setIsOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-3">
            {sections.map((section) => {
              const sectionItems = navigation.filter((item) => item.section === section.key);
              if (sectionItems.length === 0) return null;

              return (
                <div key={section.key}>
                  {!isCollapsed && (
                    <div className="px-2 pb-2 text-[10px] tracking-wide uppercase text-slate-500">
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
                          className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-150 group ${
                            isActive
                              ? 'bg-slate-800 text-slate-100 border border-slate-700'
                              : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                          } ${isCollapsed ? 'justify-center' : ''}`}
                          title={isCollapsed ? item.name : undefined}
                          aria-label={isCollapsed ? item.name : undefined}
                        >
                          <item.icon
                            className={`w-5 h-5 shrink-0 ${isActive ? 'text-slate-100' : 'text-slate-500 group-hover:text-slate-300'}`}
                          />
                          {!isCollapsed && (
                            <span className="text-sm font-medium whitespace-nowrap">
                              {item.name}
                            </span>
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
                  className="w-full px-2 pb-2 text-[10px] tracking-wide uppercase text-slate-500 flex items-center justify-between hover:text-slate-300 transition-colors"
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
                          className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-150 group ${
                            isActive
                              ? 'bg-slate-800 text-slate-100 border border-slate-700'
                              : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                          }`}
                        >
                          <item.icon
                            className={`w-5 h-5 shrink-0 ${isActive ? 'text-slate-100' : 'text-slate-500 group-hover:text-slate-300'}`}
                          />
                          <span className="text-sm font-medium whitespace-nowrap">{item.name}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Collapse Toggle */}
          <div className="hidden md:flex p-4 border-t border-white/10 bg-black/20 justify-end">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-transparent/5 transition-colors w-full flex justify-center"
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
              className={`flex items-center gap-3 px-4 py-2 w-full rounded-md text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors ${
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
