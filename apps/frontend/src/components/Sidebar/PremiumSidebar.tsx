import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, LogOut, X } from 'lucide-react';
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { SIDEBAR_NAVIGATION, type SidebarNavItem } from '../../config/sidebarNavigation';
import { useAuth } from '../../hooks/useAuth';
import { useAuthorization } from '../../hooks/useAuthorization';

import { TNF_LOGO_SRC } from '../brand/TnfLogo';
const TNF_LOGO_URL = TNF_LOGO_SRC;

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
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'workspace', label: 'Workspace' },
  ];
  const advancedItems = navigation.filter(
    (item) =>
      item.section === 'advanced' ||
      item.section === 'forge' ||
      item.section === 'nexus' ||
      item.section === 'apex'
  );
  const hasAdvancedItems = advancedItems.length > 0;

  // State for advanced toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

  // State for grouped sub-page navigation (parent items with children)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (name: string) =>
    setExpandedGroups((prev) => ({ ...prev, [name]: !prev[name] }));

  const visibleChildren = (item: SidebarNavItem) =>
    (item.children ?? []).filter(
      (child) =>
        !child.requiredRoles || child.requiredRoles.length === 0 || hasRole(child.requiredRoles)
    );

  const renderNavItem = (item: SidebarNavItem, collapsed: boolean) => {
    const isActive =
      item.href === '/'
        ? pathname === '/'
        : pathname === item.href || pathname.startsWith(`${item.href}/`);
    const children = visibleChildren(item);
    const hasChildren = children.length > 0;
    const isExpanded = !!expandedGroups[item.name];

    const link = (
      <NavLink
        to={item.href}
        onClick={() => setIsOpen(false)}
        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-150 group ${
          isActive
            ? 'bg-slate-800 text-slate-100 border border-slate-700'
            : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
        } ${collapsed ? 'justify-center' : ''} ${hasChildren && !collapsed ? 'flex-1 min-w-0' : ''}`}
        title={collapsed ? item.name : undefined}
        aria-label={collapsed ? item.name : undefined}
      >
        <item.icon
          className={`w-5 h-5 shrink-0 ${isActive ? 'text-slate-100' : 'text-slate-400 group-hover:text-slate-300'}`}
        />
        {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{item.name}</span>}
      </NavLink>
    );

    if (!hasChildren) return <React.Fragment key={item.name}>{link}</React.Fragment>;

    return (
      <div key={item.name}>
        <div className={`flex items-center gap-1 ${collapsed ? 'justify-center' : ''}`}>
          {link}
          {!collapsed && (
            <button
              type="button"
              onClick={() => toggleGroup(item.name)}
              aria-expanded={isExpanded}
              aria-controls={`nav-group-${item.name.replace(/\s+/g, '-')}`}
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${item.name} navigation`}
              className="shrink-0 p-1.5 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
        {!collapsed && isExpanded && (
          <div
            id={`nav-group-${item.name.replace(/\s+/g, '-')}`}
            className="mt-1 ml-4 pl-3 border-l border-slate-800 space-y-0.5"
          >
            {children.map((child) => {
              const childActive = pathname === child.href || pathname.startsWith(`${child.href}/`);
              return (
                <NavLink
                  key={child.name}
                  to={child.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors duration-150 ${
                    childActive
                      ? 'text-slate-100 bg-slate-800/70'
                      : 'text-slate-500 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <child.icon
                    className={`w-4 h-4 shrink-0 ${childActive ? 'text-slate-200' : 'text-slate-500'}`}
                  />
                  <span className="whitespace-nowrap truncate">{child.name}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </div>
    );
  };

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
          <div className="h-14 shrink-0 flex items-center justify-between px-3 border-b border-slate-800 overflow-hidden">
            <div
              className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? 'justify-center w-full' : ''}`}
            >
              <div className="shrink-0 w-8 h-8 rounded-md border border-slate-700/80 bg-slate-900/90 flex items-center justify-center overflow-hidden p-1">
                <img
                  src={TNF_LOGO_URL}
                  alt={isCollapsed ? 'TNF' : 'The New Fuse'}
                  className="max-h-full max-w-full w-auto h-auto object-contain"
                />
              </div>
              {!isCollapsed && (
                <span className="text-sm font-semibold text-slate-100 truncate">The New Fuse</span>
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
                    <div className="px-2 pb-2 text-[10px] tracking-wide uppercase text-slate-400">
                      {section.label}
                    </div>
                  )}
                  <div className="space-y-1">
                    {sectionItems.map((item) => renderNavItem(item, isCollapsed))}
                  </div>
                </div>
              );
            })}

            {hasAdvancedItems && !isCollapsed && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced((prev) => !prev)}
                  className="w-full px-2 pb-2 text-[10px] tracking-wide uppercase text-slate-400 flex items-center justify-between hover:text-slate-300 transition-colors"
                  aria-expanded={showAdvanced}
                  aria-controls="advanced-nav-items"
                >
                  <span>Advanced Controls</span>
                  {showAdvanced ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
                {showAdvanced && (
                  <div id="advanced-nav-items" className="space-y-1">
                    {advancedItems.map((item) => renderNavItem(item, false))}
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
