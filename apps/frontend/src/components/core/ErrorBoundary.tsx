// @ts-nocheck
import { Component, ErrorInfo, ReactNode } from 'react';
import { Logger } from '../../utils/logger';
import { performanceMonitor } from '../../utils/performance-monitor';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolate?: boolean; // Prevent error from bubbling up
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

const logger = new Logger('ErrorBoundary');
const CHUNK_RELOAD_KEY = '__tnf_chunk_reload_once__';

const isChunkLoadError = (error: Error | null | undefined): boolean => {
  if (!error) return false;

  const message = String(error.message || error.toString?.() || '').toLowerCase();
  return (
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('importing a module script failed') ||
    message.includes('loading chunk') ||
    message.includes('chunkloaderror')
  );
};

class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private readonly maxRetries = 3;

  private attemptChunkRecovery = (): boolean => {
    if (typeof window === 'undefined') return false;

    try {
      const alreadyRetried = sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1';
      if (alreadyRetried) return false;

      sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
      const url = new URL(window.location.href);
      url.searchParams.set('_tnf_refresh', String(Date.now()));
      window.location.replace(url.toString());
      return true;
    } catch {
      window.location.reload();
      return true;
    }
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const errorData = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      errorId: this.state.errorId,
      retryCount: this.retryCount,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Log with enhanced structured logging
    logger.error('Component error caught', errorData);

    // Record performance impact
    performanceMonitor.recordMetric('error-boundary-catch', 1, {
      errorType: error.name,
      component: errorInfo.componentStack.split('\n')[1]?.trim(),
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Send to monitoring service
    if (typeof window !== 'undefined' && (window as any).monitoring) {
      (window as any).monitoring.captureException(error, errorData);
    }

    if (isChunkLoadError(error)) {
      logger.warn('Detected chunk-load failure. Attempting one-time hard refresh.', {
        errorId: this.state.errorId,
        message: error.message,
      });

      if (this.attemptChunkRecovery()) {
        return;
      }
    }

    this.setState({ errorInfo });
  }

  private handleRetry = (): void => {
    if (isChunkLoadError(this.state.error)) {
      logger.info('Retry requested for chunk-load failure. Forcing full page reload.', {
        errorId: this.state.errorId,
      });

      if (!this.attemptChunkRecovery()) {
        window.location.reload();
      }
      return;
    }

    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      logger.info(`Retrying component render (attempt ${this.retryCount}/${this.maxRetries})`, {
        errorId: this.state.errorId,
      });

      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
      });
    } else {
      logger.warn('Max retry attempts reached', { errorId: this.state.errorId });
    }
  };

  private handleReload = (): void => {
    logger.info('User requested page reload', { errorId: this.state.errorId });

    if (isChunkLoadError(this.state.error) && this.attemptChunkRecovery()) {
      return;
    }

    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.retryCount < this.maxRetries;
      const isDevelopment = import.meta.env.DEV;
      const isChunkError = isChunkLoadError(this.state.error);

      return (
        <div className="error-boundary min-h-[200px] p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-red-800 mb-2">Something went wrong</h2>

            <p className="text-red-700 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>

            {isChunkError && (
              <p className="text-red-600 mb-4">
                A new app version may have been deployed. Refresh to load the latest assets.
              </p>
            )}

            {isDevelopment && this.state.errorId && (
              <p className="text-sm text-red-600 mb-4 font-mono">Error ID: {this.state.errorId}</p>
            )}

            <div className="flex gap-3 justify-center">
              {canRetry && !isChunkError && (
                <button
                  onClick={this.handleRetry}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Try Again ({this.maxRetries - this.retryCount} attempts left)
                </button>
              )}

              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                {isChunkError ? 'Refresh App' : 'Reload Page'}
              </button>
            </div>

            {isDevelopment && this.state.errorInfo && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-red-700 font-medium">
                  Technical Details (Development)
                </summary>
                <pre className="mt-2 p-4 bg-red-100 rounded text-sm overflow-auto max-h-40">
                  {this.state.error?.stack}
                  {'\n\nComponent Stack:'}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
