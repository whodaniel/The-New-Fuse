import { useEffect, useState } from 'react';
import ComprehensiveRouter from '../ComprehensiveRouter';
import ConnectExtensionPage from '../pages/ConnectExtension';
import MarketplacePublicPage from '../pages/Marketplace/MarketplacePublicPage';

// Mock function to determine if we are on an agency subdomain
const getSubdomain = () => {
  const hostname = window.location.hostname;
  // Handle localhost (e.g. agency.localhost) or production (agency.thenewfuse.hub)
  const parts = hostname.split('.');

  if (hostname.includes('localhost')) {
    // localhost is typically plain "localhost", so parts.length === 1
    // if "agency.localhost", parts.length === 2
    if (parts.length > 1 && parts[0] !== 'www') return parts[0];
  } else {
    // logic for production
    if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'app') return parts[0];
  }
  return null;
};

const SubdomainRouter: React.FC = () => {
  const [subdomain, setSubdomain] = useState<string | null>(null);

  useEffect(() => {
    const sub = getSubdomain();
    if (sub) {
      console.log('Detected Agency Subdomain:', sub);
      setSubdomain(sub);
    }
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
    // Force marketplace subdomain into standalone public marketplace experience.
    if (subdomain === 'marketplace') {
      return <MarketplacePublicPage />;
    }

    // Keep connect subdomain at root URL and render a focused extension landing page.
    if (subdomain === 'connect' && window.location.pathname === '/') {
      return <ConnectExtensionPage />;
    }

    // WHITE LABEL MODE
    // In a full implementation, we would fetch the Agency's 'Theme' here
    // and pass it to a <ThemeProvider>.
    // For now, we render the main app but maybe injected with agency context?

    // BUT, if the user explicitly wants to see the "Agency Owner Dashboard",
    // that might be a specific route.

    // For this implementation, if you go to a subdomain,
    // you see the Multitenant App with that subdomain context.

    return (
      <div data-agency-mode={subdomain}>
        <ComprehensiveRouter />
      </div>
    );
  }

  // STANDARD MODE (Main Site)
  return <ComprehensiveRouter />;
};

export default SubdomainRouter;
