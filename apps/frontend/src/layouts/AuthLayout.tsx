import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * Layout for authentication pages (login, register, etc.)
 */
const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">The New Fuse</h2>
          <p className="mt-2 text-sm text-gray-600">
            AI Agent Management Platform
          </p>
        </div>
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
