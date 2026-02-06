/**
 * Web Vitals performance monitoring
 * Tracks Core Web Vitals and custom performance metrics
 */

export interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'back-forward-cache';
}

export interface CustomPerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  url: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  vitals: WebVitalsMetric[];
  custom: CustomPerformanceMetric[];
  navigation: PerformanceNavigationTiming | null;
  resources: PerformanceResourceTiming[];
}

export interface WebVitalsConfig {
  enabled: boolean;
  reportUrl?: string;
  sampleRate?: number;
  reportAllChanges?: boolean;
  durationThreshold?: number;
  onReport?: (report: PerformanceReport) => void;
}

/**
 * Web Vitals thresholds (from web.dev)
 */
export const VITALS_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
} as const;

export class WebVitalsMonitor {
  private config: WebVitalsConfig;
  private sessionId: string;
  private vitals: WebVitalsMetric[] = [];
  private customMetrics: CustomPerformanceMetric[] = [];
  private reportTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<WebVitalsConfig> = {}) {
    this.config = {
      enabled: true,
      sampleRate: 1.0,
      reportAllChanges: false,
      durationThreshold: 0,
      ...config,
    };
    this.sessionId = this.generateSessionId();
  }

  /**
   * Initialize Web Vitals monitoring
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    // Check if we should sample this session
    if (Math.random() > (this.config.sampleRate || 1.0)) {
      return;
    }

    // Only run in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // Dynamic import to avoid issues in non-browser environments
      const { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals');

      // Track Core Web Vitals
      onCLS(this.handleMetric.bind(this), { reportAllChanges: this.config.reportAllChanges });
      onFID(this.handleMetric.bind(this), { reportAllChanges: this.config.reportAllChanges });
      onFCP(this.handleMetric.bind(this), { reportAllChanges: this.config.reportAllChanges });
      onLCP(this.handleMetric.bind(this), { reportAllChanges: this.config.reportAllChanges });
      onTTFB(this.handleMetric.bind(this), { reportAllChanges: this.config.reportAllChanges });
      onINP(this.handleMetric.bind(this), { reportAllChanges: this.config.reportAllChanges });

      // Track custom metrics
      this.trackNavigationTiming();
      this.trackResourceTiming();

      // Set up periodic reporting
      this.scheduleReport();

      // Report on page unload
      if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', () => {
          this.sendReport();
        });
      }
    } catch (error) {
      console.error('Failed to initialize Web Vitals monitoring:', error);
    }
  }

  /**
   * Handle a Web Vitals metric
   */
  private handleMetric(metric: any): void {
    const rating = this.getRating(metric.name, metric.value);

    const webVitalsMetric: WebVitalsMetric = {
      name: metric.name,
      value: metric.value,
      rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType || 'navigate',
    };

    this.vitals.push(webVitalsMetric);

    // Send immediately for poor ratings
    if (rating === 'poor') {
      this.sendReport();
    }
  }

  /**
   * Get rating for a metric value
   */
  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = VITALS_THRESHOLDS[name as keyof typeof VITALS_THRESHOLDS];
    if (!thresholds) return 'good';

    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Track custom performance metric
   */
  trackCustomMetric(name: string, value: number, metadata?: Record<string, any>): void {
    this.customMetrics.push({
      name,
      value,
      timestamp: Date.now(),
      metadata,
    });
  }

  /**
   * Track Navigation Timing
   */
  private trackNavigationTiming(): void {
    if (typeof window === 'undefined' || !window.performance) {
      return;
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.trackCustomMetric(
        'dns-lookup',
        navigation.domainLookupEnd - navigation.domainLookupStart
      );
      this.trackCustomMetric('tcp-connection', navigation.connectEnd - navigation.connectStart);
      this.trackCustomMetric('request-time', navigation.responseStart - navigation.requestStart);
      this.trackCustomMetric('response-time', navigation.responseEnd - navigation.responseStart);
      this.trackCustomMetric('dom-interactive', navigation.domInteractive - navigation.fetchStart);
      this.trackCustomMetric('dom-complete', navigation.domComplete - navigation.fetchStart);
      this.trackCustomMetric('load-complete', navigation.loadEventEnd - navigation.fetchStart);
    }
  }

  /**
   * Track Resource Timing
   */
  private trackResourceTiming(): void {
    if (typeof window === 'undefined' || !window.performance) {
      return;
    }

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    // Calculate resource loading metrics
    const scriptResources = resources.filter((r) => r.initiatorType === 'script');
    const styleResources = resources.filter(
      (r) => r.initiatorType === 'link' || r.initiatorType === 'css'
    );
    const imageResources = resources.filter((r) => r.initiatorType === 'img');

    if (scriptResources.length > 0) {
      const avgScriptLoad =
        scriptResources.reduce((sum, r) => sum + r.duration, 0) / scriptResources.length;
      this.trackCustomMetric('avg-script-load-time', avgScriptLoad, {
        count: scriptResources.length,
      });
    }

    if (styleResources.length > 0) {
      const avgStyleLoad =
        styleResources.reduce((sum, r) => sum + r.duration, 0) / styleResources.length;
      this.trackCustomMetric('avg-style-load-time', avgStyleLoad, { count: styleResources.length });
    }

    if (imageResources.length > 0) {
      const avgImageLoad =
        imageResources.reduce((sum, r) => sum + r.duration, 0) / imageResources.length;
      this.trackCustomMetric('avg-image-load-time', avgImageLoad, { count: imageResources.length });
    }

    // Track total transferred bytes
    const totalBytes = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    this.trackCustomMetric('total-transferred-bytes', totalBytes);
  }

  /**
   * Schedule periodic reporting
   */
  private scheduleReport(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
    }

    // Report every 30 seconds
    this.reportTimer = setInterval(() => {
      if (this.vitals.length > 0 || this.customMetrics.length > 0) {
        this.sendReport();
      }
    }, 30000);
  }

  /**
   * Generate performance report
   */
  private generateReport(): PerformanceReport | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    return {
      url: window.location.href,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      vitals: [...this.vitals],
      custom: [...this.customMetrics],
      navigation: navigation || null,
      resources: resources.slice(0, 50), // Limit to first 50 resources
    };
  }

  /**
   * Send performance report
   */
  private sendReport(): void {
    const report = this.generateReport();
    if (!report) {
      return;
    }

    // Call custom handler if provided
    if (this.config.onReport) {
      this.config.onReport(report);
    }

    // Send to reporting endpoint if configured
    if (this.config.reportUrl) {
      this.sendToEndpoint(report);
    }

    // Clear collected metrics after reporting
    this.vitals = [];
    this.customMetrics = [];
  }

  /**
   * Send report to endpoint
   */
  private async sendToEndpoint(report: PerformanceReport): Promise<void> {
    if (!this.config.reportUrl) {
      return;
    }

    try {
      // Use sendBeacon if available (preferred for page unload)
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(report)], { type: 'application/json' });
        navigator.sendBeacon(this.config.reportUrl, blob);
      } else {
        // Fallback to fetch
        await fetch(this.config.reportUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report),
          keepalive: true,
        });
      }
    } catch (error) {
      console.error('Failed to send performance report:', error);
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current vitals
   */
  getVitals(): WebVitalsMetric[] {
    return [...this.vitals];
  }

  /**
   * Get custom metrics
   */
  getCustomMetrics(): CustomPerformanceMetric[] {
    return [...this.customMetrics];
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = null;
    }
    this.sendReport();
  }
}

/**
 * Create and initialize Web Vitals monitor
 */
export async function createWebVitalsMonitor(
  config?: Partial<WebVitalsConfig>
): Promise<WebVitalsMonitor> {
  const monitor = new WebVitalsMonitor(config);
  await monitor.initialize();
  return monitor;
}
