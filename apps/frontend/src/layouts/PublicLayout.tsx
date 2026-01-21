import React from 'react';
import { Outlet } from 'react-router-dom';
import { SiteFooter } from '../components/SiteFooter';
import SmartNavigation from '../components/SmartNavigation';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <SmartNavigation />

      {/* Main Content Wrapper with top padding to account for fixed header */}
      <main className="flex-1 pt-16">
        <Outlet />
      </main>

      <SiteFooter />
    </div>
  );
};

export default PublicLayout;
