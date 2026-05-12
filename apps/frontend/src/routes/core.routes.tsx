/**
 * Core Routes Module
 *
 * Contains fundamental routes that don't fit into other categories:
 * - Root/Home routes
 * - Public landing pages
 * - Error pages
 */

import { lazy, type ReactElement } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { LEGACY_REDIRECTS } from '../config/legacyRedirects';

// Core Components
const CommunityHubPage = lazy(() => import('../pages/Community/CommunityHub'));
const MembershipPage = lazy(() => import('../pages/Membership'));
const SupportPage = lazy(() => import('../pages/Support'));
const OnboardingFlowPage = lazy(() => import('../pages/OnboardingFlow'));
const DocsPage = lazy(() => import('../pages/Docs'));
const ConnectExtensionPage = lazy(() => import('../pages/ConnectExtension'));
const PrivacyPolicyPage = lazy(() => import('../pages/legal/PrivacyPolicy'));
const TermsOfServicePage = lazy(() => import('../pages/legal/TermsOfService'));
const BrandIdentityPage = lazy(() => import('../pages/BrandIdentity'));
const BlogPage = lazy(() => import('../pages/Blog').then((module) => ({ default: module.Blog })));
const OnboardingPreviewPage = lazy(() => import('../pages/preview/OnboardingPreview'));
const NotFound = lazy(() => import('../pages/NotFound'));
const VisualizationsPage = lazy(() => import('../pages/Visualizations'));
const VisualizationSurfaceViewerPage = lazy(() => import('../pages/VisualizationSurfaceViewer'));
const TerminalGraphPage = lazy(() => import('../pages/TerminalGraph'));
const SystemStatusPage = lazy(() => import('../pages/SystemStatus'));
const UnauthorizedPage = lazy(() => import('../pages/Unauthorized'));

const RedirectToStatic = ({ to }: { to: string }) => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLanding = hostname === 'thenewfuse.com' || hostname === 'www.thenewfuse.com';
    const isApp = hostname === 'app.thenewfuse.com' || hostname.startsWith('app.');
    const target = to.startsWith('/') ? to : '/' + to;

    // Hash-fragment routes on app subdomain → redirect to landing domain
    if (target.startsWith('/#') && isApp) {
      window.location.href = `https://thenewfuse.com${target}`;
      return null;
    }

    // On the landing domain with a hash fragment — just scroll, no reload
    if (isLanding && target.startsWith('/#')) {
      const hash = target.slice(2);
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.hash = hash;
      }
      return null;
    }

    // On landing domain targeting '/' — just scroll to top, no reload
    if (isLanding && target === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return null;
    }

    // General case: full navigation
    window.location.href = to;
  }
  return null;
};

const MarketplaceRootRoute = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // Marketplace subdomain → show marketplace page
    if (hostname === 'marketplace.thenewfuse.com') {
      return <Navigate to="/marketplace" replace />;
    }

    // Landing domain → render nothing (static HTML is already showing)
    if (hostname === 'thenewfuse.com' || hostname === 'www.thenewfuse.com') {
      return null;
    }
  }
  return <RedirectToStatic to="/" />;
};

/**
 * Core route definitions
 * These are the foundational routes of the application
 */
export const coreRoutes: ReactElement[] = [
  // Root and Home
  <Route key="root" path="/" element={<MarketplaceRootRoute />} />,
  <Route key="app-html" path="/app.html" element={<Navigate to="/dashboard" replace />} />,
  <Route key="home" path="/home" element={<RedirectToStatic to="/" />} />,

  // Legacy Redirects
  ...LEGACY_REDIRECTS.map((redirect) => (
    <Route
      key={`legacy-redirect:${redirect.from}`}
      path={redirect.from}
      element={<Navigate to={redirect.to} replace />}
    />
  )),

  // Public Pages
  <Route key="community" path="/community" element={<CommunityHubPage />} />,
  <Route key="membership" path="/membership" element={<MembershipPage />} />,
  <Route key="support" path="/support" element={<SupportPage />} />,
  <Route key="contact" path="/contact" element={<SupportPage />} />,
  <Route key="brand" path="/brand" element={<BrandIdentityPage />} />,
  <Route key="design-system" path="/design-system" element={<BrandIdentityPage />} />,
  <Route key="blog" path="/blog" element={<BlogPage />} />,

  // Onboarding
  <Route key="onboarding" path="/onboarding" element={<OnboardingFlowPage />} />,
  <Route key="onboarding-preview" path="/preview/onboarding" element={<OnboardingPreviewPage />} />,
  <Route key="onboarding-ai-agent" path="/onboarding/ai-agent" element={<OnboardingFlowPage />} />,

  // Documentation
  <Route key="docs" path="/docs" element={<DocsPage />} />,
  <Route key="docs-wildcard" path="/docs/*" element={<DocsPage />} />,

  // Visualizations
  <Route key="visualizations" path="/visualizations" element={<VisualizationsPage />} />,
  <Route
    key="visualization-surface-viewer"
    path="/visualizations/surface"
    element={<VisualizationSurfaceViewerPage />}
  />,
  <Route
    key="terminal-graph-visualization"
    path="/visualizations/terminals"
    element={<TerminalGraphPage />}
  />,
  <Route key="public-status" path="/status" element={<SystemStatusPage />} />,
  <Route key="public-system-status" path="/system-status" element={<SystemStatusPage />} />,
  <Route key="terminal-graph" path="/terminals" element={<TerminalGraphPage />} />,

  // Connect/Extension
  <Route key="connect" path="/connect" element={<ConnectExtensionPage />} />,

  // Legal
  <Route key="privacy" path="/legal/privacy" element={<PrivacyPolicyPage />} />,
  <Route key="terms" path="/legal/terms" element={<TermsOfServicePage />} />,

  // Redirects
  <Route key="landing-redirect" path="/landing" element={<RedirectToStatic to="/" />} />,
  <Route key="about-redirect" path="/about" element={<Navigate to="/brand" replace />} />,
  <Route key="features-redirect" path="/features" element={<RedirectToStatic to="/#features" />} />,
  <Route key="pricing-redirect" path="/pricing" element={<RedirectToStatic to="/#pricing" />} />,

  // Error Pages
  <Route key="not-found" path="/not-found" element={<NotFound />} />,
  <Route key="unauthorized" path="/unauthorized" element={<UnauthorizedPage />} />,
  <Route key="catch-all" path="*" element={<NotFound />} />,
];

/**
 * Public route paths (for route guard logic)
 */
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/landing',
  '/home',
  '/pricing',
  '/community',
  '/support',
  '/contact',
  '/brand',
  '/blog',
  '/marketplace',
  '/visualizations',
  '/visualizations/surface',
  '/visualizations/terminals',
  '/visualizations/concordance',
  '/status',
  '/system-status',
  '/terminals',
  '/product-map',
  '/capabilities',
  '/design-system',
  '/app.html',
];
