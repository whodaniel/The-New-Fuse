import { ReactLenis } from 'lenis/react';
import React from 'react';

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis root>
      <div className="min-h-screen bg-[#0A0A0F] text-white selection:bg-purple-500/30 selection:text-purple-200">
        {children}
      </div>
    </ReactLenis>
  );
}
