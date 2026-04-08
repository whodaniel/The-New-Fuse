import { useEffect, useState } from 'react';
import ComprehensiveRouter from '../ComprehensiveRouter';
import ConnectExtensionPage from '../pages/ConnectExtension';
import MarketplacePublicPage from '../pages/Marketplace/MarketplacePublicPage';

// Determine if we are on a specific subdomain
const getSubdomainInfo = () => {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');

  if (hostname.includes('localhost')) {
    if (parts.length > 1 && parts[0] !== 'www') {
      return {
        name: parts[0],
        isApp: parts[0] === 'app' || parts[0] === 'saas',
      };
    }
  } else {
    // production: parts = [subdomain, domain, tld] e.g. [app, thenewfuse, com]
    if (parts.length > 2 && parts[0] !== 'www') {
      return {
        name: parts[0],
        isApp: parts[0] === 'app',
      };
    }
  }
  return { name: null, isApp: false };
};

const SubdomainRouter: React.FC = () => {
  const [{ name: subdomain, isApp }, setSubdomainInfo] = useState(() => {
    if (typeof window === 'undefined') return { name: null, isApp: false };
    return getSubdomainInfo();
  });

  useEffect(() => {
    const info = getSubdomainInfo();
    if (info.name) console.log('Detected Subdomain:', info.name, 'isApp:', info.isApp);
    setSubdomainInfo(info);
  }, []);

  if (subdomain && !isApp) {
    // Marketplace runs as a standalone surface
    if (subdomain === 'marketplace') {
      const pathname = window.location.pathname;
      const isSharedAuthPath =
        pathname === '/login' ||
        pathname === '/register' ||
        pathname.startsWith('/auth/') ||
        pathname === '/auth';

      if (isSharedAuthPath) {
        return <ComprehensiveRouter />;
      }

      return <MarketplacePublicPage />;
    }

    // Keep connect subdomain at root URL
    if (subdomain === 'connect' && window.location.pathname === '/') {
      return <ConnectExtensionPage />;
    }

    // WHITE LABEL MODE / AGENCY MODE
    return (
      <div data-agency-mode={subdomain}>
        <ComprehensiveRouter />
      </div>
    );
  }

  // STANDARD MODE (Main Site or app. subdomain)
  return <ComprehensiveRouter isApp={isApp} />;
};

export default SubdomainRouter;
