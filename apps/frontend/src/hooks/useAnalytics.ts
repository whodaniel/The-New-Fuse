import { useCallback, useEffect } from 'react';

/**
 * Analytics Event Interface
 */
export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

/**
 * Analytics Provider Interface
 *
 * Implement this interface to integrate with your analytics service
 * (e.g., Google Analytics, Mixpanel, Segment, Amplitude, etc.)
 */
export interface AnalyticsProvider {
  trackEvent: (event: string, properties?: Record<string, any>) => void;
  trackPageView: (url: string, properties?: Record<string, any>) => void;
  identifyUser: (userId: string, traits?: Record<string, any>) => void;
  reset: () => void;
}

/**
 * Console Analytics Provider (Development/Debugging)
 *
 * Logs events to console for development and testing
 */
class ConsoleAnalyticsProvider implements AnalyticsProvider {
  trackEvent(event: string, properties?: Record<string, any>): void {
    console.log('[Analytics] Event:', event, properties || {});
  }

  trackPageView(url: string, properties?: Record<string, any>): void {
    console.log('[Analytics] Page View:', url, properties || {});
  }

  identifyUser(userId: string, traits?: Record<string, any>): void {
    console.log('[Analytics] Identify User:', userId, traits || {});
  }

  reset(): void {
    console.log('[Analytics] Reset');
  }
}

/**
 * Google Analytics 4 Provider
 *
 * Integrates with Google Analytics 4 via gtag
 */
class GA4Provider implements AnalyticsProvider {
  trackEvent(event: string, properties?: Record<string, any>): void {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, properties);
    }
  }

  trackPageView(url: string, properties?: Record<string, any>): void {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', (window as any).GA_MEASUREMENT_ID, {
        page_path: url,
        ...properties,
      });
    }
  }

  identifyUser(userId: string, traits?: Record<string, any>): void {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', (window as any).GA_MEASUREMENT_ID, {
        user_id: userId,
        ...traits,
      });
    }
  }

  reset(): void {
    // GA4 doesn't have a direct reset method
    // User session will naturally expire
  }
}

/**
 * Segment Analytics Provider
 *
 * Integrates with Segment.com
 */
class SegmentProvider implements AnalyticsProvider {
  trackEvent(event: string, properties?: Record<string, any>): void {
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track(event, properties);
    }
  }

  trackPageView(url: string, properties?: Record<string, any>): void {
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.page(properties);
    }
  }

  identifyUser(userId: string, traits?: Record<string, any>): void {
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.identify(userId, traits);
    }
  }

  reset(): void {
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.reset();
    }
  }
}

/**
 * Custom Analytics Provider
 *
 * Sends events to your own analytics API
 */
class CustomAPIProvider implements AnalyticsProvider {
  private apiEndpoint: string;

  constructor(apiEndpoint: string = '/api/analytics') {
    this.apiEndpoint = apiEndpoint;
  }

  private async sendToAPI(endpoint: string, data: any): Promise<void> {
    try {
      await fetch(`${this.apiEndpoint}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });
    } catch (error) {
      console.error('[Analytics] Failed to send event:', error);
    }
  }

  trackEvent(event: string, properties?: Record<string, any>): void {
    this.sendToAPI('/track', { event, properties });
  }

  trackPageView(url: string, properties?: Record<string, any>): void {
    this.sendToAPI('/pageview', { url, properties });
  }

  identifyUser(userId: string, traits?: Record<string, any>): void {
    this.sendToAPI('/identify', { userId, traits });
  }

  reset(): void {
    // Custom implementation if needed
  }
}

/**
 * Multi-Provider Analytics
 *
 * Sends events to multiple analytics providers simultaneously
 */
class MultiProvider implements AnalyticsProvider {
  private providers: AnalyticsProvider[];

  constructor(providers: AnalyticsProvider[]) {
    this.providers = providers;
  }

  trackEvent(event: string, properties?: Record<string, any>): void {
    this.providers.forEach(provider => provider.trackEvent(event, properties));
  }

  trackPageView(url: string, properties?: Record<string, any>): void {
    this.providers.forEach(provider => provider.trackPageView(url, properties));
  }

  identifyUser(userId: string, traits?: Record<string, any>): void {
    this.providers.forEach(provider => provider.identifyUser(userId, traits));
  }

  reset(): void {
    this.providers.forEach(provider => provider.reset());
  }
}

/**
 * Get Analytics Provider
 *
 * Returns the appropriate analytics provider based on environment
 */
function getAnalyticsProvider(): AnalyticsProvider {
  // In development, use console logging
  if (process.env.NODE_ENV === 'development') {
    return new ConsoleAnalyticsProvider();
  }

  // Check for available analytics services
  const providers: AnalyticsProvider[] = [];

  // Google Analytics 4
  if (typeof window !== 'undefined' && (window as any).gtag) {
    providers.push(new GA4Provider());
  }

  // Segment
  if (typeof window !== 'undefined' && (window as any).analytics) {
    providers.push(new SegmentProvider());
  }

  // Custom API (always available)
  providers.push(new CustomAPIProvider());

  // Return multi-provider if we have multiple, or single provider
  if (providers.length > 1) {
    return new MultiProvider(providers);
  } else if (providers.length === 1) {
    return providers[0];
  }

  // Fallback to console
  return new ConsoleAnalyticsProvider();
}

/**
 * useAnalytics Hook
 *
 * Provides analytics tracking functionality throughout the app
 *
 * @example
 * ```tsx
 * const { trackEvent, trackPageView, identifyUser } = useAnalytics();
 *
 * // Track a custom event
 * trackEvent('button_click', {
 *   button_id: 'signup',
 *   location: 'hero',
 * });
 *
 * // Track a page view
 * trackPageView('/pricing');
 *
 * // Identify a user
 * identifyUser('user_123', {
 *   email: 'user@example.com',
 *   plan: 'pro',
 * });
 * ```
 */
export function useAnalytics() {
  const provider = getAnalyticsProvider();

  /**
   * Track a custom event
   */
  const trackEvent = useCallback(
    (event: string, properties?: Record<string, any>) => {
      try {
        provider.trackEvent(event, {
          ...properties,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('[Analytics] Error tracking event:', error);
      }
    },
    [provider]
  );

  /**
   * Track a page view
   */
  const trackPageView = useCallback(
    (url?: string, properties?: Record<string, any>) => {
      try {
        const pageUrl = url || window.location.pathname;
        provider.trackPageView(pageUrl, {
          ...properties,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('[Analytics] Error tracking page view:', error);
      }
    },
    [provider]
  );

  /**
   * Identify the current user
   */
  const identifyUser = useCallback(
    (userId: string, traits?: Record<string, any>) => {
      try {
        provider.identifyUser(userId, traits);
      } catch (error) {
        console.error('[Analytics] Error identifying user:', error);
      }
    },
    [provider]
  );

  /**
   * Reset analytics (e.g., on logout)
   */
  const reset = useCallback(() => {
    try {
      provider.reset();
    } catch (error) {
      console.error('[Analytics] Error resetting:', error);
    }
  }, [provider]);

  /**
   * Track conversion events (high-value actions)
   */
  const trackConversion = useCallback(
    (conversionType: string, value?: number, properties?: Record<string, any>) => {
      trackEvent('conversion', {
        conversion_type: conversionType,
        value,
        ...properties,
      });
    },
    [trackEvent]
  );

  /**
   * Track form submissions
   */
  const trackFormSubmit = useCallback(
    (formId: string, properties?: Record<string, any>) => {
      trackEvent('form_submit', {
        form_id: formId,
        ...properties,
      });
    },
    [trackEvent]
  );

  /**
   * Track CTA clicks
   */
  const trackCTAClick = useCallback(
    (ctaId: string, location: string, properties?: Record<string, any>) => {
      trackEvent('cta_click', {
        cta_id: ctaId,
        location,
        ...properties,
      });
    },
    [trackEvent]
  );

  return {
    trackEvent,
    trackPageView,
    identifyUser,
    reset,
    trackConversion,
    trackFormSubmit,
    trackCTAClick,
  };
}

/**
 * Analytics Context for Provider Configuration
 *
 * Use this if you want to configure analytics at app level
 */
export const AnalyticsContext = {
  ConsoleAnalyticsProvider,
  GA4Provider,
  SegmentProvider,
  CustomAPIProvider,
  MultiProvider,
};

export default useAnalytics;
