import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast'; // Added Toaster import
import { Outlet } from 'react-router-dom';
import { PremiumHeader } from '../components/Navigation/PremiumHeader';
import { PremiumSidebar } from '../components/Sidebar/PremiumSidebar';
import { PremiumBackground } from '../components/ui/premium/PremiumBackground';

interface PremiumLayoutProps {
  children?: React.ReactNode;
}

export const PremiumLayout: React.FC<PremiumLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen w-full text-gray-100 font-sans selection:bg-blue-500/30 border-4 border-yellow-500">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black"
      >
        Skip to main content
      </a>
      <PremiumBackground />

      <PremiumSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="lg:pl-72 w-full flex flex-col min-h-screen transition-all duration-300">
        <PremiumHeader onMenuClick={() => setIsSidebarOpen(true)} />

        <main id="main-content" className="flex-1 w-full p-4 sm:p-6 lg:p-8 relative z-10">
          <div className="w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PremiumLayout;
