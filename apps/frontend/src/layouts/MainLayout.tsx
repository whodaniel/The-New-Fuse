import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';

const MainLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <img
                  className="h-8 w-auto"
                  src="/logo.svg"
                  alt="Logo"
                />
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
