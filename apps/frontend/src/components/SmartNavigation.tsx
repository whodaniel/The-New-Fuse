// @ts-nocheck
import {
  Activity,
  BarChart3,
  Bot,
  Boxes,
  ChevronDown,
  ClipboardList,
  Compass,
  Database,
  Eye,
  Globe,
  Layout,
  Lightbulb,
  LogOut,
  Menu,
  Network,
  Package,
  Plus,
  Settings,
  Shield,
  SquareTerminal,
  User,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { EXPERIENCE_SURFACES } from '../config/experienceArchitecture';

import { useAuth } from '../hooks/useAuth';
import { useAuthorization } from '../hooks/useAuthorization';

const TNF_LOGO_URL = 'https://thenewfuse.com/assets/brand/tnf-logo.png';

interface DomainMenuItem {
  to: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DomainMenu {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeClassName: string;
  matchPrefixes: string[];
  items: DomainMenuItem[];
}

// Smart Navigation Component that adapts based on authentication status and user role
function SmartNavigation() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const { isSuperAdmin, isAdmin: isAnyAdmin, hasRole } = useAuthorization();
  const navRef = useRef<HTMLDivElement>(null);

  // Check roles for menu gating
  const _isAdmin = isAnyAdmin || user?.role === 'admin';
  const _isAgencyRole = hasRole(['AGENCY_OWNER', 'AGENCY_ADMIN', 'AGENCY_MANAGER']);

  const isPublicPage =
    [
      '/',
      '/login',
      '/register',
      '/legal/privacy',
      '/legal/terms',
      '/brand',
      '/design-system',
    ].includes(location.pathname) || location.pathname.startsWith('/auth');

  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const lifecycleByPath = new Map<string, string>();
  for (const surface of EXPERIENCE_SURFACES) {
    lifecycleByPath.set(surface.path, surface.lifecycle);
    surface.aliases?.forEach((alias) => lifecycleByPath.set(alias, surface.lifecycle));
  }

  const domainMenus: DomainMenu[] = [
    {
      key: 'operate',
      label: 'Operate',
      icon: SquareTerminal,
      activeClassName: 'bg-blue-500/10 text-blue-400',
      matchPrefixes: ['/dashboard', '/agents', '/tasks', '/timeline'],
      items: [
        {
          to: '/dashboard',
          label: 'Operations Dashboard',
          description: 'Current system health and priorities',
          icon: Activity,
        },
        {
          to: '/agents',
          label: 'Agent Fleet',
          description: 'Manage autonomous swarms',
          icon: Bot,
        },
        {
          to: '/tasks',
          label: 'Task Operations',
          description: 'Track and execute work',
          icon: ClipboardList,
        },
        {
          to: '/timeline',
          label: 'Unified Timeline',
          description: 'Chronological execution events',
          icon: Activity,
        },
      ],
    },
    {
      key: 'automate',
      label: 'Automate',
      icon: Workflow,
      activeClassName: 'bg-purple-500/10 text-purple-400',
      matchPrefixes: ['/workflows'],
      items: [
        {
          to: '/workflows',
          label: 'Workflow Operations',
          description: 'Orchestrate automation flows',
          icon: Workflow,
        },
        {
          to: '/workflows/builder',
          label: 'Workflow Builder',
          description: 'Design and edit orchestration graphs',
          icon: Plus,
        },
        {
          to: '/workflows/executions',
          label: 'Execution Monitor',
          description: 'Inspect active and historical runs',
          icon: BarChart3,
        },
      ],
    },
    {
      key: 'observe',
      label: 'Observe',
      icon: Compass,
      activeClassName: 'bg-cyan-500/10 text-cyan-400',
      matchPrefixes: ['/analytics', '/observatory', '/live-view', '/suggestions'],
      items: [
        {
          to: '/analytics',
          label: 'Analytics',
          description: 'Operational KPIs and outcomes',
          icon: BarChart3,
        },
        {
          to: '/observatory',
          label: 'System Observatory',
          description: 'Platform telemetry and health',
          icon: Network,
        },
        {
          to: '/live-view',
          label: 'Live Viewer',
          description: 'Real-time cloud sandbox activity',
          icon: Globe,
        },
        {
          to: '/suggestions',
          label: 'Ideation Layer',
          description: 'AI-driven opportunity suggestions',
          icon: Lightbulb,
        },
      ],
    },
    {
      key: 'ecosystem',
      label: 'Ecosystem',
      icon: Layout,
      activeClassName: 'bg-emerald-500/10 text-emerald-400',
      matchPrefixes: ['/hub', '/sophisticated-hub', '/mcp-hub', '/marketplace', '/knowledge-hub'],
      items: [
        {
          to: '/hub',
          label: 'TNF Hub',
          description: 'Primary ecosystem entry point',
          icon: Layout,
        },
        {
          to: '/mcp-hub',
          label: 'MCP Protocol Hub',
          description: 'Model context and integrations',
          icon: Boxes,
        },
        {
          to: '/marketplace',
          label: 'Platform',
          description: 'Marketplace and ecosystem surface',
          icon: Package,
        },
        {
          to: '/knowledge-hub',
          label: 'Knowledge Hub',
          description: 'Shared memory and references',
          icon: Database,
        },
      ],
    },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown when navigating to a new page
  useEffect(() => {
    setActiveDropdown(null);
  }, [location.pathname]);

  // Render logic for menu items with role gating
  const _renderMenuItem = (item: DomainMenuItem) => {
    const lifecycle = lifecycleByPath.get(item.to);
    const ItemIcon = item.icon;

    // Check if user has required roles for this specific menu item
    if (item.requiredRoles && !hasRole(item.requiredRoles)) {
      return null;
    }

    return (
      <Link
        key={item.to}
        to={item.to}
        className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-md group"
      >
        <ItemIcon className="w-4 h-4 text-slate-400 group-hover:text-white" />
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-200 flex items-center gap-2">
            <span>{item.label}</span>
            {lifecycle && lifecycle !== 'production' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 uppercase tracking-wide">
                {lifecycle}
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 truncate">{item.description}</div>
        </div>
      </Link>
    );
  };

  // Public Navigation (for non-authenticated users)
  if (!isAuthenticated || isPublicPage) {
    return (
      <nav
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10 transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-3 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link to="/" className="shrink-0 flex items-center group">
                <img
                  src={TNF_LOGO_URL}
                  alt="The New Fuse Logo"
                  className="h-10 w-10 rounded-md shadow-none group-hover:scale-105 transition-transform object-cover"
                />
                <h1 className="ml-3 text-xl font-bold text-white tracking-tight group-hover:opacity-90 transition-opacity">
                  The New Fuse
                </h1>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <Link to="/#features" className="text-sm font-medium text-slate-400 hover:text-white">
                Features
              </Link>
              <Link to="/agents" className="text-sm font-medium text-slate-400 hover:text-white">
                Fleet
              </Link>
              <Link to="/workflows" className="text-sm font-medium text-slate-400 hover:text-white">
                Automation
              </Link>
              <Link
                to="/marketplace"
                className="text-sm font-medium text-slate-400 hover:text-white"
              >
                Platform
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white">
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-transparent text-gray-900 hover:bg-muted/30 px-5 py-2 rounded-full font-bold text-sm transition-all transform hover:scale-105 shadow-glow-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Authenticated User Navigation
  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center shadow-none group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="ml-3 text-lg font-bold text-white">TNF</span>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/dashboard'
                    ? 'bg-transparent/10 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-transparent/5'
                }`}
              >
                Dashboard
              </Link>

              {domainMenus.map((menu) => {
                const Icon = menu.icon;
                const isActive =
                  activeDropdown === menu.key ||
                  menu.matchPrefixes.some((prefix) => location.pathname.startsWith(prefix));

                return (
                  <div key={menu.key} className="relative">
                    <button
                      onClick={() => toggleDropdown(menu.key)}
                      aria-expanded={activeDropdown === menu.key}
                      className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                        isActive
                          ? menu.activeClassName
                          : 'text-slate-400 hover:text-white hover:bg-transparent/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {menu.label}
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${activeDropdown === menu.key ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {activeDropdown === menu.key && (
                      <div className="absolute top-full left-0 mt-2 w-72 bg-slate-900 border border-white/10 rounded-md shadow-none p-2 z-50">
                        {menu.items.map((item) => {
                          const ItemIcon = item.icon;
                          const lifecycle = lifecycleByPath.get(item.to);

                          return (
                            <Link
                              key={item.to}
                              to={item.to}
                              className="flex items-center gap-3 px-3 py-2 hover:bg-transparent/5 rounded-md group"
                            >
                              <ItemIcon className="w-4 h-4 text-slate-300 group-hover:text-white" />
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-slate-200 flex items-center gap-2">
                                  <span>{item.label}</span>
                                  {lifecycle && lifecycle !== 'production' && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 uppercase tracking-wide">
                                      {lifecycle}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {item.description}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isSuperAdmin && (
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('admin')}
                  aria-label="Admin Menu"
                  aria-expanded={activeDropdown === 'admin'}
                  className="w-10 h-10 flex items-center justify-center rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
                >
                  <Shield className="w-5 h-5" />
                </button>
                {activeDropdown === 'admin' && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900 border border-white/10 rounded-md shadow-none p-2 z-50">
                    <div className="px-3 py-2 text-[10px] font-bold text-red-500 uppercase tracking-widest">
                      Platform Governance
                    </div>
                    {isSuperAdmin && (
                      <Link
                        to="/admin/control-panel"
                        className="flex items-center gap-3 px-3 py-2 hover:bg-transparent/5 rounded-md text-red-400 font-bold border-b border-white/10 mb-1"
                      >
                        <Zap className="w-4 h-4" />
                        MASTER CONTROL
                      </Link>
                    )}
                    <Link
                      to="/admin/dashboard"
                      className="flex items-center gap-3 px-3 py-2 hover:bg-transparent/5 rounded-md"
                    >
                      <Zap className="w-4 h-4" />
                      MASTER CONTROL
                    </Link>
                    <Link
                      to="/observatory"
                      className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-md"
                    >
                      <Eye className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">System Observatory</span>
                    </Link>
                    <Link
                      to="/admin/users"
                      className="flex items-center gap-3 px-3 py-2 hover:bg-transparent/5 rounded-md"
                    >
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">User & Tenant Ops</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div className="relative">
              <button
                onClick={() => toggleDropdown('user')}
                aria-label="User Menu"
                aria-expanded={activeDropdown === 'user'}
                className="flex items-center gap-2 p-1.5 rounded-md bg-transparent/5 border border-white/10 hover:bg-transparent/10 transition-colors"
              >
                <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center text-[10px] font-bold">
                  {user?.name?.substring(0, 2).toUpperCase() || 'BS'}
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              {activeDropdown === 'user' && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-slate-900 border border-white/10 rounded-md shadow-none p-2 z-50">
                  <div className="px-3 py-2">
                    <div className="text-sm font-medium text-white">{user?.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
                  </div>
                  <div className="my-1 border-t border-white/10" />
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-3 py-2 hover:bg-transparent/5 rounded-md"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">Profile</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-3 py-2 hover:bg-transparent/5 rounded-md"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">Account Settings</span>
                  </Link>
                  <Link
                    to="/pricing"
                    className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-md"
                  >
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">Membership & Billing</span>
                  </Link>
                  <div className="my-1 border-t border-white/10" />
                  <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-red-500/10 rounded-md text-red-400 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            <button
              aria-label="Open mobile menu"
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-md bg-transparent/5 text-slate-400 hover:text-white transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default SmartNavigation;
