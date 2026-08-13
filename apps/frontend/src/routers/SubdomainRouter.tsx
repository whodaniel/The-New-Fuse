import { useEffect, useState } from 'react';
import ComprehensiveRouter from '../ComprehensiveRouter';
import ConnectExtensionPage from '../pages/ConnectExtension';
import MarketplacePublicPage from '../pages/Marketplace/MarketplacePublicPage';

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
    if (parts.length > 2 && parts[0] !== 'www') {
      return {
        name: parts[0],
        isApp: parts[0] === 'app',
      };
    }
  }
  return { name: null, isApp: false };
};

// Check if the current host is the main landing domain (thenewfuse.com/www.thenewfuse.com)
const isLandingDomain = () => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'thenewfuse.com' || host === 'www.thenewfuse.com';
};

// Functional/app routes that should NOT be handled by the landing domain.
// If a user lands on these paths on thenewfuse.com, redirect them to app.thenewfuse.com.
const FUNCTIONAL_PATHS = [
  '/auth/login',
  '/auth/register',
  '/login',
  '/register',
  '/dashboard',
  '/agents',
  '/workflows',
  '/settings',
  '/workspace',
  '/tasks',
  '/chat',
  '/admin',
  '/agency',
  '/mcp-hub',
  '/knowledge-hub',
  '/a2a-control',
  '/hub',
  '/resources',
  '/hosting',
  '/spaces',
  '/space',
  '/marketplace',
  '/suggestions',
  '/goals',
  '/plans',
  '/timeline',
  '/analytics',
  '/onboarding',
  '/codebase-map',
  '/app',
  '/app.html',
];

const isFunctionalPath = (pathname: string) => {
  return FUNCTIONAL_PATHS.some(
    (fp) => pathname === fp || pathname.startsWith(fp + '/')
  );
};

const SubdomainRouter: React.FC = () => {
  const [subdomain, setSubdomain] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return getSubdomainInfo().name;
  });
  const [isApp, setIsApp] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return getSubdomainInfo().isApp;
  });

  useEffect(() => {
    const { name: sub, isApp: app } = getSubdomainInfo();
    if (sub) console.log('Detected Subdomain:', sub);
    setSubdomain(sub);
    setIsApp(app);
  }, []);

  // ─── Landing domain guard ───
  // On thenewfuse.com/www.thenewfuse.com, functional routes must redirect
  // to app.thenewfuse.com. The landing domain only serves the marketing page.
  // (The Cloudflare edge function handles this too, but this is a client-side
  // safety net for SPA navigation or direct entry after initial load.)
  if (isLandingDomain() && isFunctionalPath(window.location.pathname)) {
    const targetPath = window.location.pathname.replace(/^\/app(\.html)?/, '') || '/dashboard';
    window.location.replace(`https://app.thenewfuse.com${targetPath}${window.location.search}${window.location.hash}`);
    return null;
  }

  // On the landing domain with no functional path, render the landing page.
  // ComprehensiveRouter will return null for the root route on landing domain,
  // letting the static HTML (index.html) content remain visible.
  if (isLandingDomain()) {
    return <ComprehensiveRouter isApp={false} />;
  }

  if (subdomain) {
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

    if (subdomain === 'connect' && window.location.pathname === '/') {
      return <ConnectExtensionPage />;
    }

    if (isApp) {
      return <ComprehensiveRouter isApp={isApp} />;
    }

    return (
      <div data-agency-mode={subdomain}>
        <ComprehensiveRouter isApp={isApp} />
      </div>
    );
  }

  return <ComprehensiveRouter isApp={false} />;
};

export default SubdomainRouter;
