import React from 'react';
import { Outlet } from 'react-router-dom';
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
 * This adds only a floating logo that navigates home — no sidebar, no footer,
 * nothing that consumes canvas space.
 */
export const FullscreenBrandLayout: React.FC<FullscreenBrandLayoutProps> = ({ children }) => {
  return (
    <>
      {children || <Outlet />}

      <div className="fixed left-4 top-4 z-50 pointer-events-none">
        <div className="pointer-events-auto rounded-md bg-slate-950/70 backdrop-blur-sm p-1.5 shadow-lg ring-1 ring-white/10">
          <TnfLogo size={28} to="/dashboard" />
        </div>
      </div>
    </>
  );
};

export default FullscreenBrandLayout;
