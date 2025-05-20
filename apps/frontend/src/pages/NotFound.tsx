import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <p className="mt-2 text-lg text-gray-600">Page not found</p>
        <Link 
          to="/" 
          className="mt-4 inline-block text-blue-500 hover:text-blue-600"
        >
          Return to home
        </Link>
      </div>
    </div>
  );
};
