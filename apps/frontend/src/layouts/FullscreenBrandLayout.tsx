import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  MessageSquare,
  Store,
  Workflow,
} from 'lucide-react';
import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { TnfLogo } from '../components/brand/TnfLogo';

interface FullscreenBrandLayoutProps {
  children?: React.ReactNode;
}

/**
 * Minimal chrome for routes that own their whole viewport — the workflow
 * builder, Nexus, and other canvas surfaces.
 *
 * These deliberately opt out of PremiumLayout because a sidebar and footer would
 * fight the canvas. But opting out of the shell also meant opting out of the
 * brand mark and any way back, leaving a user stranded on a full-screen tool.
 *
 * Chrome provided here (all floating, nothing consumes canvas space):
 *  - Top-left: brand mark that navigates home.
 *  - Bottom-center: a compact, collapsible navigation cluster with the
 *    destinations a user is most likely to need when leaving a canvas tool.
 */
const CANVAS_NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Workflows', href: '/workflows', icon: Workflow },
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Marketplace', href: '/marketplace', icon: Store },
] as const;

export const FullscreenBrandLayout: React.FC<FullscreenBrandLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);

  return (
    <>
      {children || <Outlet />}

      {/* Brand mark — always a way back home, even with the cluster collapsed. */}
      <div className="fixed left-4 top-4 z-50 pointer-events-none">
        <div className="pointer-events-auto rounded-md bg-slate-950/70 backdrop-blur-sm p-1.5 shadow-lg ring-1 ring-white/10">
          <TnfLogo size={28} to="/dashboard" />
        </div>
      </div>

      {/* Floating navigation cluster — ample exits without stealing canvas.
          Bottom-center is the neutral zone: canvas CTAs sit bottom-left,
          panels/docks sit right, so this rarely overlaps tool chrome. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 pointer-events-none">
        <nav
          aria-label="Canvas navigation"
          className="pointer-events-auto flex items-center gap-1 rounded-full bg-slate-950/80 backdrop-blur-md px-2 py-1.5 shadow-xl ring-1 ring-white/10"
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            title="Go back"
            aria-label="Go back"
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {!isNavCollapsed &&
            CANVAS_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                title={item.name}
                aria-label={item.name}
                className={({ isActive }) =>
                  `flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                    isActive
                      ? 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/40'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
              </NavLink>
            ))}

          <button
            type="button"
            onClick={() => setIsNavCollapsed((prev) => !prev)}
            title={isNavCollapsed ? 'Show navigation' : 'Hide navigation'}
            aria-label={isNavCollapsed ? 'Show navigation' : 'Hide navigation'}
            aria-expanded={!isNavCollapsed}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            {isNavCollapsed ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
        </nav>
      </div>
    </>
  );
};

export default FullscreenBrandLayout;
