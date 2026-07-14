import React from 'react';
import { Outlet } from 'react-router-dom';
import FeatureAIAssistDock from '../components/ai/FeatureAIAssistDock';
import { SiteFooter } from '../components/SiteFooter';
import SmartNavigation from '../components/SmartNavigation';

interface PublicLayoutProps {
  children?: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <SmartNavigation />

      {/* Main Content Wrapper with top padding to account for fixed header */}
      <main className="flex-1 pt-16 relative">
        {children || <Outlet />}
        <FeatureAIAssistDock variant="dock" />
      </main>

      <SiteFooter />
    </div>
  );
};

export default PublicLayout;
