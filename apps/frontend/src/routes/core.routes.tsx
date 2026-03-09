/**
 * Core Routes Module
 *
 * Contains fundamental routes that don't fit into other categories:
 * - Root/Home routes
 * - Public landing pages
 * - Error pages
 */

import { lazy, type ReactElement } from 'react';
import { Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { LEGACY_REDIRECTS } from '../config/legacyRedirects';

// Lazy load components - using type-safe lazy import pattern
const LazyComponent = <T extends React.ComponentType<unknown>>(loader: () => Promise<{ default: T }>) =>
  lazy(loader);

// Core Components
const MarketplaceRootRoute = LazyComponent(() => import('../pages/MarketplaceRootRoute'));
const AllPages = LazyComponent(() => import('../pages/AllPages'));
const CommunityHubPage = LazyComponent(() => import('../pages/community/CommunityHubPage'));
const MembershipPage = LazyComponent(() => import('../pages/MembershipPage'));
const SupportPage = LazyComponent(() => import('../pages/SupportPage'));
const OnboardingFlowPage = LazyComponent(() => import('../pages/OnboardingFlowPage'));
const DocsPage = LazyComponent(() => import('../pages/DocsPage'));
const ConnectExtensionPage = LazyComponent(() => import('../pages/ConnectExtensionPage'));
const PrivacyPolicyPage = LazyComponent(() => import('../pages/legal/PrivacyPolicyPage'));
const TermsOfServicePage = LazyComponent(() => import('../pages/legal/TermsOfServicePage'));
const BrandIdentityPage = LazyComponent(() => import('../pages/BrandIdentityPage'));
const BlogPage = LazyComponent(() => import('../pages/BlogPage'));
const OnboardingPreviewPage = LazyComponent(() => import('../pages/OnboardingPreviewPage'));
const NotFound = LazyComponent(() => import('../pages/NotFound'));
const UnauthorizedPage = LazyComponent(() => import('../pages/UnauthorizedPage'));
const RedirectToStatic = LazyComponent(() => import('../components/RedirectToStatic'));

/**
 * Core route definitions
 * These are the foundational routes of the application
 */
export const coreRoutes: ReactElement[] = [
  // Root and Home
  <Route key="root" path="/" element={<MarketplaceRootRoute />} />,
  <Route key="app-html" path="/app.html" element={<MarketplaceRootRoute />} />,
  <Route key="home" path="/home" element={<AllPages />} />,

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

  // Connect/Extension
  <Route key="connect" path="/connect" element={<ConnectExtensionPage />} />,

  // Legal
  <Route key="privacy" path="/legal/privacy" element={<PrivacyPolicyPage />} />,
  <Route key="terms" path="/legal/terms" element={<TermsOfServicePage />} />,

  // Redirects
  <Route key="landing-redirect" path="/landing" element={<RedirectToStatic to="/" />} />,
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
  '/product-map',
  '/capabilities',
  '/design-system',
  '/app.html',
];
