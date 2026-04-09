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
  const [subdomain, setSubdomain] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return getSubdomain();
  });

  useEffect(() => {
    const sub = getSubdomain();
    if (sub) console.log('Detected Agency Subdomain:', sub);
    setSubdomain(sub);
  }, []);

  // If we are on a subdomain (e.g., alpha.thenewfuse.hub), we might want to show
  // the Agency's Public Landing Page OR their Admin Dashboard if they are logged in as owner.
  // For the purpose of "Accessing their own super admin account",
  // let's route /admin on a subdomain to the AgencyDashboard.

  // Actually, typical White Label structure:
  // 1. agency.thenewfuse.hub -> The Agency's "SaaS" (multitenant instance for THEIR users)
  // 2. app.thenewfuse.hub/agency/dashboard -> Where the Agency Owner manages their empire

  // The user asked: "infrastructure... to have their own multitenent system for their own Users"
  // So `agency.thenewfuse.hub` should look like a branded version of TNF.

  if (subdomain) {
    // Marketplace runs as a standalone surface, but it still uses shared TNF auth routes.
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

    // Keep connect subdomain at root URL and render a focused extension landing page.
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
