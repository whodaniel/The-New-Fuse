import {
  Activity,
  Bot,
  Boxes,
  ChevronDown,
  ClipboardList,
  CreditCard,
  Database,
  Eye,
  FolderOpen,
  Globe,
  Layout,
  Lightbulb,
  LogOut,
  MessageSquare,
  Network,
  Package,
  Settings,
  Shield,
  SquareTerminal,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { EXPERIENCE_DOMAIN_LABELS, EXPERIENCE_SURFACES } from '../config/experienceArchitecture';

import { useAuth } from '../hooks/useAuth';
import { useAuthorization } from '../hooks/useAuthorization';

interface DomainMenuItem {
  to: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredRoles?: string[];
}

interface DomainMenu {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeClassName: string;
  matchPrefixes: string[];
  items: DomainMenuItem[];
}

// Smart Navigation Component refined for logical grouping and full feature parity.
function SmartNavigation() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const { isSuperAdmin, isAdmin: isAnyAdmin, hasRole } = useAuthorization();
  const navRef = useRef<HTMLDivElement>(null);

  // Check roles for menu gating
  const isAdmin = isAnyAdmin || user?.role === 'admin';
  const isAgencyRole = hasRole(['AGENCY_OWNER', 'AGENCY_ADMIN', 'AGENCY_MANAGER']);

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
      label: EXPERIENCE_DOMAIN_LABELS.operate,
      icon: SquareTerminal,
      activeClassName: 'bg-blue-500/10 text-blue-400',
      matchPrefixes: ['/dashboard', '/agents', '/tasks', '/timeline'],
      items: [
        {
          to: '/dashboard',
          label: 'Operations Dashboard',
          description: 'System-wide health and execution metrics',
          icon: Activity,
        },
        {
          to: '/agents',
          label: 'Agent Fleet',
          description: 'Monitor and manage active autonomous swarms',
          icon: Bot,
        },
        {
          to: '/tasks',
          label: 'Task Operations',
          description: 'Live task queue and execution status',
          icon: ClipboardList,
        },
        {
          to: '/timeline',
          label: 'Unified Timeline',
          description: 'Chronological platform events and logs',
          icon: Activity,
        },
      ],
    },
    {
      key: 'intelligence',
      label: EXPERIENCE_DOMAIN_LABELS.intelligence,
      icon: Workflow,
      activeClassName: 'bg-purple-500/10 text-purple-400',
      matchPrefixes: ['/workflows', '/mcp-hub', '/knowledge-hub'],
      items: [
        {
          to: '/workflows',
          label: 'Workflow Engine',
          description: 'Design and orchestrate complex automations',
          icon: Workflow,
        },
        {
          to: '/mcp-hub',
          label: 'MCP Tool Hub',
          description: 'Manage Model Context Protocol capabilities',
          icon: Boxes,
        },
        {
          to: '/knowledge-hub',
          label: 'Knowledge & Memory',
          description: 'Shared agent memory and RAG repositories',
          icon: Database,
        },
      ],
    },
    {
      key: 'collaboration',
      label: EXPERIENCE_DOMAIN_LABELS.collaboration,
      icon: Users,
      activeClassName: 'bg-indigo-500/10 text-indigo-400',
      matchPrefixes: ['/chat', '/workspace', '/spaces'],
      items: [
        {
          to: '/chat',
          label: 'Universal Chat',
          description: 'Multi-agent threaded conversation interface',
          icon: MessageSquare,
        },
        {
          to: '/workspace/overview',
          label: 'Workspace Home',
          description: 'Collaborative team environment and tools',
          icon: Layout,
        },
        {
          to: '/spaces',
          label: 'Project Spaces',
          description: 'Isolated project visualizations and domains',
          icon: Globe,
        },
      ],
    },
    {
      key: 'assets',
      label: EXPERIENCE_DOMAIN_LABELS.assets,
      icon: FolderOpen,
      activeClassName: 'bg-emerald-500/10 text-emerald-400',
      matchPrefixes: ['/files', '/datasets', '/bookmarks'],
      items: [
        {
          to: '/files',
          label: 'File Manager',
          description: 'Centralized asset storage and search',
          icon: FolderOpen,
        },
        {
          to: '/datasets',
          label: 'Data Workbench',
          description: 'Manage and inspect agent training data',
          icon: Database,
        },
        {
          to: '/bookmarks',
          label: 'Resource Bookmarks',
          description: 'Quick access to critical platform assets',
          icon: Lightbulb,
        },
      ],
    },
    {
      key: 'ecosystem',
      label: EXPERIENCE_DOMAIN_LABELS.ecosystem,
      icon: Network,
      activeClassName: 'bg-cyan-500/10 text-cyan-400',
      matchPrefixes: ['/marketplace', '/hub', '/agency'],
      items: [
        {
          to: '/marketplace',
          label: 'Platform Marketplace',
          description: 'Discover and deploy external capabilities',
          icon: Package,
        },
        {
          to: '/hub',
          label: 'TNF Hub',
          description: 'Community and ecosystem entry point',
          icon: Network,
        },
        {
          to: '/agency/dashboard',
          label: 'Agency Dashboard',
          description: 'White-label management and tenant controls',
          icon: Shield,
          requiredRoles: ['AGENCY_OWNER', 'AGENCY_ADMIN', 'AGENCY_MANAGER'],
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
  const renderMenuItem = (item: DomainMenuItem) => {
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
          <div className="text-[10px] text-slate-500 truncate">{item.description}</div>
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
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link to="/" className="shrink-0 flex items-center group">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h1 className="ml-3 text-lg font-bold text-white tracking-tight">THE NEW FUSE</h1>
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
                className="bg-white text-slate-950 px-5 py-2 rounded-full font-bold text-sm hover:bg-slate-200 transition-colors"
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
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="ml-3 text-lg font-bold text-white">TNF</span>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {domainMenus.map((menu) => {
                const Icon = menu.icon;
                const isActive =
                  activeDropdown === menu.key ||
                  menu.matchPrefixes.some((prefix) => location.pathname.startsWith(prefix));

                return (
                  <div key={menu.key} className="relative">
                    <button
                      onClick={() => toggleDropdown(menu.key)}
                      className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                        isActive
                          ? menu.activeClassName
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {menu.label}
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${activeDropdown === menu.key ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {activeDropdown === menu.key && (
                      <div className="absolute top-full left-0 mt-2 w-72 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-2 z-50">
                        {menu.items.map(renderMenuItem)}
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
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
                >
                  <Shield className="w-5 h-5" />
                </button>
                {activeDropdown === 'admin' && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-2 z-50">
                    <div className="px-3 py-2 text-[10px] font-bold text-red-500 uppercase tracking-widest">
                      Platform Governance
                    </div>
                    <Link
                      to="/admin/control-panel"
                      className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-md text-red-400 font-bold"
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
                      className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-md"
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
                className="flex items-center gap-2 p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center text-[10px] font-bold text-white">
                  {user?.name?.substring(0, 2).toUpperCase() || 'BS'}
                </div>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>
              {activeDropdown === 'user' && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-2 z-50">
                  <div className="px-3 py-2">
                    <div className="text-sm font-medium text-white">{user?.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{user?.email}</div>
                  </div>
                  <div className="my-1 border-t border-white/5" />
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-md"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">Account Settings</span>
                  </Link>
                  <Link
                    to="/billing"
                    className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-md"
                  >
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">Membership & Billing</span>
                  </Link>
                  <div className="my-1 border-t border-white/5" />
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
          </div>
        </div>
      </div>
    </nav>
  );
}

export default SmartNavigation;
