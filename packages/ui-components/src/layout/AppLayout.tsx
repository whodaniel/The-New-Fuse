import React, { FC } from "react";
import { Outlet } from 'react-router-dom';

// Create a simple Navbar component to replace the external import
const Navbar: FC = () => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="text-xl font-bold">The New Fuse</div>
        <nav>
          <ul className="flex space-x-4">
            <li><a href="/dashboard" className="hover:text-blue-500">Dashboard</a></li>
            <li><a href="/workspace" className="hover:text-blue-500">Workspace</a></li>
            <li><a href="/settings" className="hover:text-blue-500">Settings</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

interface AppLayoutProps {
  // Add any props here if needed
}

const AppLayout: FC<AppLayoutProps> = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      <main className="container mx-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
