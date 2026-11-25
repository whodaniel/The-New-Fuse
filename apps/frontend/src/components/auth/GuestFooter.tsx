import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Shared legal footer for the bare-layout guest pages (login, register,
 * forgot-password, onboarding). Those routes render without PublicLayout,
 * so the SiteFooter's Privacy/Terms links cannot be inherited — this
 * component carries the same hrefs and labels into the pages themselves.
 */
const GuestFooter: React.FC = () => {
  return (
    <footer className="mt-6 text-center text-sm text-slate-400">
      <Link to="/legal/privacy" className="text-blue-400 hover:text-blue-300">
        Privacy Policy
      </Link>
      {' · '}
      <Link to="/legal/terms" className="text-blue-400 hover:text-blue-300">
        Terms of Service
      </Link>
    </footer>
  );
};

export default GuestFooter;
