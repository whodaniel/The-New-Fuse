import React from 'react';
import { Link } from 'react-router-dom';

/**
 * ComponentsNav - A simple navigation page to access the components showcase
 */
const ComponentsNav: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-transparent p-4">
      <div className="max-w-md w-full bg-transparent rounded-md shadow-none p-4">
        <h1 className="text-2xl font-bold text-center mb-8">UI Components Navigation</h1>

        <div className="space-y-4">
          <Link
            to="/components"
            className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md text-center transition-colors"
          >
            View All Components
          </Link>

          <Link
            to="/layout-example"
            className="block w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md text-center transition-colors"
          >
            View Layout Example
          </Link>

          <Link
            to="/"
            className="block w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md text-center transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ComponentsNav;
