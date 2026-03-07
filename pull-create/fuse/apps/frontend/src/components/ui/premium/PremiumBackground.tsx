import React from 'react';

/**
 * PremiumBackground Component
 * Renders a sophisticated animated gradient background
 */
export const PremiumBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 bg-slate-900 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

      {/* Animated orbs */}
      <div className="absolute top-0 -left-20 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[128px] mix-blend-screen animate-pulse-slow" />
      <div className="absolute bottom-0 -right-20 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[128px] mix-blend-screen animate-pulse-slow delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[128px] mix-blend-screen animate-pulse-slow delay-2000" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-slate-950/80" />
    </div>
  );
};
