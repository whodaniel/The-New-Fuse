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
declare class ConsoleAnalyticsProvider implements AnalyticsProvider {
    trackEvent(event: string, properties?: Record<string, any>): void;
    trackPageView(url: string, properties?: Record<string, any>): void;
    identifyUser(userId: string, traits?: Record<string, any>): void;
    reset(): void;
}
/**
 * Google Analytics 4 Provider
 *
 * Integrates with Google Analytics 4 via gtag
 */
declare class GA4Provider implements AnalyticsProvider {
    trackEvent(event: string, properties?: Record<string, any>): void;
    trackPageView(url: string, properties?: Record<string, any>): void;
    identifyUser(userId: string, traits?: Record<string, any>): void;
    reset(): void;
}
/**
 * Segment Analytics Provider
 *
 * Integrates with Segment.com
 */
declare class SegmentProvider implements AnalyticsProvider {
    trackEvent(event: string, properties?: Record<string, any>): void;
    trackPageView(url: string, properties?: Record<string, any>): void;
    identifyUser(userId: string, traits?: Record<string, any>): void;
    reset(): void;
}
/**
 * Custom Analytics Provider
 *
 * Sends events to your own analytics API
 */
declare class CustomAPIProvider implements AnalyticsProvider {
    private apiEndpoint;
    constructor(apiEndpoint?: string);
    private sendToAPI;
    trackEvent(event: string, properties?: Record<string, any>): void;
    trackPageView(url: string, properties?: Record<string, any>): void;
    identifyUser(userId: string, traits?: Record<string, any>): void;
    reset(): void;
}
/**
 * Multi-Provider Analytics
 *
 * Sends events to multiple analytics providers simultaneously
 */
declare class MultiProvider implements AnalyticsProvider {
    private providers;
    constructor(providers: AnalyticsProvider[]);
    trackEvent(event: string, properties?: Record<string, any>): void;
    trackPageView(url: string, properties?: Record<string, any>): void;
    identifyUser(userId: string, traits?: Record<string, any>): void;
    reset(): void;
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
export declare function useAnalytics(): {
    trackEvent: (event: string, properties?: Record<string, any>) => void;
    trackPageView: (url?: string, properties?: Record<string, any>) => void;
    identifyUser: (userId: string, traits?: Record<string, any>) => void;
    reset: () => void;
    trackConversion: (conversionType: string, value?: number, properties?: Record<string, any>) => void;
    trackFormSubmit: (formId: string, properties?: Record<string, any>) => void;
    trackCTAClick: (ctaId: string, location: string, properties?: Record<string, any>) => void;
};
/**
 * Analytics Context for Provider Configuration
 *
 * Use this if you want to configure analytics at app level
 */
export declare const AnalyticsContext: {
    ConsoleAnalyticsProvider: typeof ConsoleAnalyticsProvider;
    GA4Provider: typeof GA4Provider;
    SegmentProvider: typeof SegmentProvider;
    CustomAPIProvider: typeof CustomAPIProvider;
    MultiProvider: typeof MultiProvider;
};
export default useAnalytics;
