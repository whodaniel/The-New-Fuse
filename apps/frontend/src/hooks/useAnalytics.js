var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { useCallback } from 'react';
/**
 * Console Analytics Provider (Development/Debugging)
 *
 * Logs events to console for development and testing
 */
var ConsoleAnalyticsProvider = /** @class */ (function () {
    function ConsoleAnalyticsProvider() {
    }
    ConsoleAnalyticsProvider.prototype.trackEvent = function (event, properties) {
        console.log('[Analytics] Event:', event, properties || {});
    };
    ConsoleAnalyticsProvider.prototype.trackPageView = function (url, properties) {
        console.log('[Analytics] Page View:', url, properties || {});
    };
    ConsoleAnalyticsProvider.prototype.identifyUser = function (userId, traits) {
        console.log('[Analytics] Identify User:', userId, traits || {});
    };
    ConsoleAnalyticsProvider.prototype.reset = function () {
        console.log('[Analytics] Reset');
    };
    return ConsoleAnalyticsProvider;
}());
/**
 * Google Analytics 4 Provider
 *
 * Integrates with Google Analytics 4 via gtag
 */
var GA4Provider = /** @class */ (function () {
    function GA4Provider() {
    }
    GA4Provider.prototype.trackEvent = function (event, properties) {
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', event, properties);
        }
    };
    GA4Provider.prototype.trackPageView = function (url, properties) {
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('config', window.GA_MEASUREMENT_ID, __assign({ page_path: url }, properties));
        }
    };
    GA4Provider.prototype.identifyUser = function (userId, traits) {
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('config', window.GA_MEASUREMENT_ID, __assign({ user_id: userId }, traits));
        }
    };
    GA4Provider.prototype.reset = function () {
        // GA4 doesn't have a direct reset method
        // User session will naturally expire
    };
    return GA4Provider;
}());
/**
 * Segment Analytics Provider
 *
 * Integrates with Segment.com
 */
var SegmentProvider = /** @class */ (function () {
    function SegmentProvider() {
    }
    SegmentProvider.prototype.trackEvent = function (event, properties) {
        if (typeof window !== 'undefined' && window.analytics) {
            window.analytics.track(event, properties);
        }
    };
    SegmentProvider.prototype.trackPageView = function (url, properties) {
        if (typeof window !== 'undefined' && window.analytics) {
            window.analytics.page(properties);
        }
    };
    SegmentProvider.prototype.identifyUser = function (userId, traits) {
        if (typeof window !== 'undefined' && window.analytics) {
            window.analytics.identify(userId, traits);
        }
    };
    SegmentProvider.prototype.reset = function () {
        if (typeof window !== 'undefined' && window.analytics) {
            window.analytics.reset();
        }
    };
    return SegmentProvider;
}());
/**
 * Custom Analytics Provider
 *
 * Sends events to your own analytics API
 */
var CustomAPIProvider = /** @class */ (function () {
    function CustomAPIProvider(apiEndpoint) {
        if (apiEndpoint === void 0) { apiEndpoint = '/api/analytics'; }
        this.apiEndpoint = apiEndpoint;
    }
    CustomAPIProvider.prototype.sendToAPI = function (endpoint, data) {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fetch("".concat(this.apiEndpoint).concat(endpoint), {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(__assign(__assign({}, data), { timestamp: Date.now(), url: window.location.href, userAgent: navigator.userAgent })),
                            })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error('[Analytics] Failed to send event:', error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    CustomAPIProvider.prototype.trackEvent = function (event, properties) {
        this.sendToAPI('/track', { event: event, properties: properties });
    };
    CustomAPIProvider.prototype.trackPageView = function (url, properties) {
        this.sendToAPI('/pageview', { url: url, properties: properties });
    };
    CustomAPIProvider.prototype.identifyUser = function (userId, traits) {
        this.sendToAPI('/identify', { userId: userId, traits: traits });
    };
    CustomAPIProvider.prototype.reset = function () {
        // Custom implementation if needed
    };
    return CustomAPIProvider;
}());
/**
 * Multi-Provider Analytics
 *
 * Sends events to multiple analytics providers simultaneously
 */
var MultiProvider = /** @class */ (function () {
    function MultiProvider(providers) {
        this.providers = providers;
    }
    MultiProvider.prototype.trackEvent = function (event, properties) {
        this.providers.forEach(function (provider) { return provider.trackEvent(event, properties); });
    };
    MultiProvider.prototype.trackPageView = function (url, properties) {
        this.providers.forEach(function (provider) { return provider.trackPageView(url, properties); });
    };
    MultiProvider.prototype.identifyUser = function (userId, traits) {
        this.providers.forEach(function (provider) { return provider.identifyUser(userId, traits); });
    };
    MultiProvider.prototype.reset = function () {
        this.providers.forEach(function (provider) { return provider.reset(); });
    };
    return MultiProvider;
}());
/**
 * Get Analytics Provider
 *
 * Returns the appropriate analytics provider based on environment
 */
function getAnalyticsProvider() {
    // In development, use console logging
    if (process.env.NODE_ENV === 'development') {
        return new ConsoleAnalyticsProvider();
    }
    // Check for available analytics services
    var providers = [];
    // Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag) {
        providers.push(new GA4Provider());
    }
    // Segment
    if (typeof window !== 'undefined' && window.analytics) {
        providers.push(new SegmentProvider());
    }
    // Custom API (always available)
    providers.push(new CustomAPIProvider());
    // Return multi-provider if we have multiple, or single provider
    if (providers.length > 1) {
        return new MultiProvider(providers);
    }
    else if (providers.length === 1) {
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
    var provider = getAnalyticsProvider();
    /**
     * Track a custom event
     */
    var trackEvent = useCallback(function (event, properties) {
        try {
            provider.trackEvent(event, __assign(__assign({}, properties), { timestamp: Date.now() }));
        }
        catch (error) {
            console.error('[Analytics] Error tracking event:', error);
        }
    }, [provider]);
    /**
     * Track a page view
     */
    var trackPageView = useCallback(function (url, properties) {
        try {
            var pageUrl = url || window.location.pathname;
            provider.trackPageView(pageUrl, __assign(__assign({}, properties), { timestamp: Date.now() }));
        }
        catch (error) {
            console.error('[Analytics] Error tracking page view:', error);
        }
    }, [provider]);
    /**
     * Identify the current user
     */
    var identifyUser = useCallback(function (userId, traits) {
        try {
            provider.identifyUser(userId, traits);
        }
        catch (error) {
            console.error('[Analytics] Error identifying user:', error);
        }
    }, [provider]);
    /**
     * Reset analytics (e.g., on logout)
     */
    var reset = useCallback(function () {
        try {
            provider.reset();
        }
        catch (error) {
            console.error('[Analytics] Error resetting:', error);
        }
    }, [provider]);
    /**
     * Track conversion events (high-value actions)
     */
    var trackConversion = useCallback(function (conversionType, value, properties) {
        trackEvent('conversion', __assign({ conversion_type: conversionType, value: value }, properties));
    }, [trackEvent]);
    /**
     * Track form submissions
     */
    var trackFormSubmit = useCallback(function (formId, properties) {
        trackEvent('form_submit', __assign({ form_id: formId }, properties));
    }, [trackEvent]);
    /**
     * Track CTA clicks
     */
    var trackCTAClick = useCallback(function (ctaId, location, properties) {
        trackEvent('cta_click', __assign({ cta_id: ctaId, location: location }, properties));
    }, [trackEvent]);
    return {
        trackEvent: trackEvent,
        trackPageView: trackPageView,
        identifyUser: identifyUser,
        reset: reset,
        trackConversion: trackConversion,
        trackFormSubmit: trackFormSubmit,
        trackCTAClick: trackCTAClick,
    };
}
/**
 * Analytics Context for Provider Configuration
 *
 * Use this if you want to configure analytics at app level
 */
export var AnalyticsContext = {
    ConsoleAnalyticsProvider: ConsoleAnalyticsProvider,
    GA4Provider: GA4Provider,
    SegmentProvider: SegmentProvider,
    CustomAPIProvider: CustomAPIProvider,
    MultiProvider: MultiProvider,
};
export default useAnalytics;
