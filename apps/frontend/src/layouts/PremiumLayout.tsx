import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast'; // Added Toaster import
import { Outlet, useLocation } from 'react-router-dom';
import { PremiumHeader } from '../components/Navigation/PremiumHeader';
import { PremiumSidebar } from '../components/Sidebar/PremiumSidebar';
import FeatureAIAssistDock from '../components/ai/FeatureAIAssistDock';
import { PremiumBackground } from '../components/ui/premium/PremiumBackground';

interface PremiumLayoutProps {
  children?: React.ReactNode;
}

export const PremiumLayout: React.FC<PremiumLayoutProps> = ({ children }) => {
  const { pathname } = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Workspace surfaces get tighter padding for data-dense views
  const isWorkspaceSurface =
    pathname.startsWith('/dashboard/fairtable') ||
    pathname.startsWith('/dashboard/files') ||
    pathname.startsWith('/dashboard/datasets') ||
    pathname.startsWith('/workflows/builder');

  useEffect(() => {
    const handleSidebarToggle = () => {
      setIsSidebarOpen((prev) => !prev);
    };

    document.addEventListener('sidebar:toggle', handleSidebarToggle);
    return () => {
      document.removeEventListener('sidebar:toggle', handleSidebarToggle);
    };
  }, []);

  return (
    <div className="min-h-screen w-full text-gray-100 font-sans selection:bg-blue-500/30">
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

      <PremiumSidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div
        className={`w-full flex flex-col min-h-screen transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        <PremiumHeader onMenuClick={() => setIsSidebarOpen(true)} />

        <main
          id="main-content"
          className={`flex-1 w-full relative z-10 overflow-x-hidden ${
            isWorkspaceSurface
              ? 'px-2 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5 xl:px-8'
              : 'p-4 sm:p-6 lg:p-8'
          }`}
        >
          <div
            className={`w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 ${
              isWorkspaceSurface ? 'max-w-[1720px] space-y-4' : 'max-w-7xl'
            }`}
          >
            {children || <Outlet />}
          </div>
        </main>

        <div className="fixed right-6 bottom-6 z-40 hidden xl:block">
          <FeatureAIAssistDock variant="dock" />
        </div>
      </div>
    </div>
  );
};

export default PremiumLayout;
