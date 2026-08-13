import React from 'react';
import { Link } from 'react-router-dom';
import { TnfLogo } from '../components/brand/TnfLogo';

/**
 * The router renders /404 with no layout wrapper, so this page has to carry the
 * brand mark and navigation itself — otherwise it is the one page a lost visitor
 * lands on with no way onward.
 */
const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center px-4">
      <TnfLogo size={56} showWordmark wordmarkClassName="text-2xl text-white" />

      <div className="text-center mt-10">
        <h1 className="text-5xl font-bold text-white">404</h1>
        <p className="mt-3 text-lg text-gray-400">We couldn&apos;t find that page.</p>

        <nav className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
          <Link to="/" className="text-blue-400 hover:text-blue-300 transition-colors">
            Home
          </Link>
          <Link to="/dashboard" className="text-blue-400 hover:text-blue-300 transition-colors">
            Dashboard
          </Link>
          <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
            Sign in
          </Link>
        </nav>
      </div>
    </div>
  );
};

export default NotFound;
