/**
 * Error Reproduction Tools
 *
 * @description
 * Tools for capturing, storing, and reproducing errors in development
 * and testing environments for easier debugging and troubleshooting.
 */

import { ApplicationError } from '../errors/CustomErrors.js';
import { ErrorContext } from '../interfaces/IErrorHandling.js';
import { Logger } from './Logger.js';

/**
 * Error reproduction data
 */
export interface ErrorReproductionData {
  id: string;
  error: ApplicationError;
  context: ErrorContext;
  timestamp: Date;
  environment: EnvironmentSnapshot;
  requestData?: RequestSnapshot;
  stateSnapshot?: Record<string, any>;
  breadcrumbs: Breadcrumb[];
  reproducible: boolean;
  reproductionSteps?: string[];
}

/**
 * Environment snapshot
 */
export interface EnvironmentSnapshot {
  userAgent?: string;
  platform?: string;
  language?: string;
  screenResolution?: string;
  viewport?: { width: number; height: number };
  timezone?: string;
  memory?: { usedJSHeapSize?: number; totalJSHeapSize?: number };
  connection?: { effectiveType?: string; downlink?: number };
}

/**
 * Request snapshot
 */
export interface RequestSnapshot {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
  params?: Record<string, string>;
}

/**
 * Breadcrumb for tracking user actions
 */
export interface Breadcrumb {
  timestamp: Date;
  category: string;
  message: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

/**
 * Error recorder for capturing reproduction data
 */
export class ErrorRecorder {
  private logger: Logger;
  private recordings: Map<string, ErrorReproductionData> = new Map();
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 50;
  private stateCapture?: () => Record<string, any>;

  constructor() {
    this.logger = new Logger('ErrorRecorder');
    this.setupBreadcrumbCapture();
  }

  /**
   * Record an error with full reproduction data
   */
  record(
    error: ApplicationError,
    context: ErrorContext,
    requestData?: RequestSnapshot,
    additionalData?: Record<string, any>
  ): ErrorReproductionData {
    const id = this.generateId();

    const reproductionData: ErrorReproductionData = {
      id,
      error,
      context,
      timestamp: new Date(),
      environment: this.captureEnvironment(),
      requestData,
      stateSnapshot: this.stateCapture ? this.stateCapture() : undefined,
      breadcrumbs: [...this.breadcrumbs],
      reproducible: this.determineReproducibility(error),
      reproductionSteps: this.generateReproductionSteps(error, context),
    };

    // Add additional data
    if (additionalData) {
      reproductionData.stateSnapshot = {
        ...reproductionData.stateSnapshot,
        ...additionalData,
      };
    }

    this.recordings.set(id, reproductionData);
    this.logger.info('Error recorded for reproduction', { id, errorCode: error.code });

    return reproductionData;
  }

  /**
   * Add breadcrumb for tracking user actions
   */
  addBreadcrumb(
    category: string,
    message: string,
    level: Breadcrumb['level'] = 'info',
    data?: Record<string, any>
  ): void {
    const breadcrumb: Breadcrumb = {
      timestamp: new Date(),
      category,
      message,
      level,
      data,
    };

    this.breadcrumbs.push(breadcrumb);

    // Keep only last N breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Get recorded error by ID
   */
  getRecording(id: string): ErrorReproductionData | undefined {
    return this.recordings.get(id);
  }

  /**
   * Get all recordings
   */
  getAllRecordings(): ErrorReproductionData[] {
    return Array.from(this.recordings.values());
  }

  /**
   * Export recording for sharing
   */
  exportRecording(id: string): string {
    const recording = this.recordings.get(id);
    if (!recording) {
      throw new Error(`Recording with ID ${id} not found`);
    }

    return JSON.stringify(recording, null, 2);
  }

  /**
   * Import recording from export
   */
  importRecording(exportData: string): ErrorReproductionData {
    const recording = JSON.parse(exportData) as ErrorReproductionData;
    this.recordings.set(recording.id, recording);
    return recording;
  }

  /**
   * Clear all recordings
   */
  clearRecordings(): void {
    this.recordings.clear();
    this.logger.info('All recordings cleared');
  }

  /**
   * Set state capture function
   */
  setStateCapture(captureFunc: () => Record<string, any>): void {
    this.stateCapture = captureFunc;
  }

  /**
   * Capture current environment
   */
  private captureEnvironment(): EnvironmentSnapshot {
    const env: EnvironmentSnapshot = {};

    if (typeof window !== 'undefined') {
      env.userAgent = navigator.userAgent;
      env.platform = navigator.platform;
      env.language = navigator.language;
      env.screenResolution = `${screen.width}x${screen.height}`;
      env.viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      env.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Memory info (Chrome only)
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        env.memory = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
        };
      }

      // Connection info
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        env.connection = {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
        };
      }
    }

    return env;
  }

  /**
   * Setup automatic breadcrumb capture
   */
  private setupBreadcrumbCapture(): void {
    if (typeof window === 'undefined') return;

    // Capture clicks
    window.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      this.addBreadcrumb('ui.click', `Clicked: ${this.getElementDescription(target)}`, 'info', {
        tagName: target.tagName,
        id: target.id,
        className: target.className,
      });
    });

    // Capture navigation
    window.addEventListener('popstate', () => {
      this.addBreadcrumb(
        'navigation',
        `Navigated to: ${window.location.href}`,
        'info',
        { url: window.location.href }
      );
    });

    // Capture console errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.addBreadcrumb('console', `Console error: ${args.join(' ')}`, 'error');
      originalConsoleError.apply(console, args);
    };
  }

  /**
   * Get element description for breadcrumbs
   */
  private getElementDescription(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  /**
   * Determine if error is reproducible
   */
  private determineReproducibility(error: ApplicationError): boolean {
    // Errors with specific patterns are more reproducible
    const reproducibleCategories = ['VALIDATION', 'BUSINESS', 'AUTHORIZATION'];
    return reproducibleCategories.includes(error.category);
  }

  /**
   * Generate reproduction steps
   */
  private generateReproductionSteps(
    error: ApplicationError,
    context: ErrorContext
  ): string[] {
    const steps: string[] = [];

    // Add breadcrumb-based steps
    this.breadcrumbs
      .filter((b) => b.category === 'ui.click' || b.category === 'navigation')
      .forEach((b) => {
        steps.push(b.message);
      });

    // Add context-based steps
    if (context.operation) {
      steps.push(`Perform operation: ${context.operation}`);
    }

    // Add error-specific step
    steps.push(`Error occurred: ${error.message}`);

    return steps;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Error replay tool for reproducing errors
 */
export class ErrorReplay {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ErrorReplay');
  }

  /**
   * Replay error from reproduction data
   */
  async replay(reproductionData: ErrorReproductionData): Promise<void> {
    this.logger.info('Starting error replay', { id: reproductionData.id });

    try {
      // Log environment differences
      this.compareEnvironment(reproductionData.environment);

      // Log breadcrumbs
      this.logger.info('Breadcrumbs leading to error:');
      reproductionData.breadcrumbs.forEach((breadcrumb, index) => {
        this.logger.info(`${index + 1}. ${breadcrumb.message}`, breadcrumb.data);
      });

      // Log reproduction steps
      if (reproductionData.reproductionSteps) {
        this.logger.info('Reproduction steps:');
        reproductionData.reproductionSteps.forEach((step, index) => {
          this.logger.info(`${index + 1}. ${step}`);
        });
      }

      // Log state snapshot
      if (reproductionData.stateSnapshot) {
        this.logger.info('State at time of error:', reproductionData.stateSnapshot);
      }

      // Log request data
      if (reproductionData.requestData) {
        this.logger.info('Request data:', reproductionData.requestData);
      }

      // Log error details
      this.logger.error('Error details:', {
        code: reproductionData.error.code,
        message: reproductionData.error.message,
        stack: reproductionData.error.stack,
        metadata: reproductionData.error.metadata,
      });
    } catch (error) {
      this.logger.error('Failed to replay error', error);
    }
  }

  /**
   * Compare current environment with recorded environment
   */
  private compareEnvironment(recordedEnv: EnvironmentSnapshot): void {
    if (typeof window === 'undefined') return;

    const currentEnv = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
    };

    const differences: string[] = [];

    if (currentEnv.userAgent !== recordedEnv.userAgent) {
      differences.push('User agent differs');
    }
    if (currentEnv.platform !== recordedEnv.platform) {
      differences.push('Platform differs');
    }
    if (currentEnv.screenResolution !== recordedEnv.screenResolution) {
      differences.push('Screen resolution differs');
    }

    if (differences.length > 0) {
      this.logger.warn('Environment differences detected:', differences);
    } else {
      this.logger.info('Environment matches recording');
    }
  }

  /**
   * Generate test case from reproduction data
   */
  generateTestCase(reproductionData: ErrorReproductionData): string {
    const testName = `should handle ${reproductionData.error.name}`;

    const testCode = `
describe('Error Reproduction: ${reproductionData.id}', () => {
  it('${testName}', async () => {
    // Setup
    const context = ${JSON.stringify(reproductionData.context, null, 4)};

    ${reproductionData.stateSnapshot ? `// State snapshot\nconst state = ${JSON.stringify(reproductionData.stateSnapshot, null, 4)};` : ''}

    ${reproductionData.requestData ? `// Request data\nconst request = ${JSON.stringify(reproductionData.requestData, null, 4)};` : ''}

    // Execute
    // TODO: Add your test logic here

    // Assert
    // TODO: Add your assertions here
  });
});
    `;

    return testCode;
  }
}

/**
 * Global error recorder instance
 */
export const errorRecorder = new ErrorRecorder();

/**
 * Global error replay instance
 */
export const errorReplay = new ErrorReplay();
