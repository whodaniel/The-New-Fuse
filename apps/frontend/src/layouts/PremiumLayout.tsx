import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { PremiumSidebar } from '../components/Sidebar/PremiumSidebar';
import { PremiumHeader } from '../components/Navigation/PremiumHeader';
import { PremiumBackground } from '../components/ui/premium/PremiumBackground';

interface PremiumLayoutProps {
  children?: React.ReactNode;
}

export const PremiumLayout: React.FC<PremiumLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen text-gray-100 font-sans selection:bg-blue-500/30">
      <PremiumBackground />

      <PremiumSidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="lg:pl-72 flex flex-col min-h-screen transition-all duration-300">
        <PremiumHeader onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 relative z-10">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PremiumLayout;
