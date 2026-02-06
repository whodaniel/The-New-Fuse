/**
 * Error Boundary Component
 *
 * @description
 * Catches JavaScript errors in component tree, logs them to error reporting service,
 * and displays a fallback UI instead of crashing the entire React application.
 *
 * This component provides comprehensive error handling with:
 * - Automatic error recovery
 * - Detailed error logging
 * - Customizable fallback UI
 * - Error reporting integration
 * - DevTools support for debugging
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallback={CustomErrorFallback}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 *
 * @since 1.0.0
 * @author Frontend Team
 * @see {@link https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary}
 */

import { AlertCircle, Bug, Home, RefreshCw } from 'lucide-react';
import React, { Component, ErrorInfo, ReactNode, isValidElement } from 'react';
import { reportError } from '../services/error-tracking.service';
import { logger } from '../utils/logger';
import { Button } from './ui/Button';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ErrorBoundaryProps {
  /** Child components to wrap with error boundary */
  children: ReactNode;

  /** Custom fallback component to display on error */
  fallback?: React.ComponentType<ErrorFallbackProps>;

  /** Error reporting service configuration */
  errorReporting?: {
    enabled: boolean;
    level?: 'error' | 'warning' | 'info';
    context?: Record<string, any>;
  };

  /** Enable detailed error information for development */
  showDetails?: boolean;

  /** CSS class name for styling */
  className?: string;

  /** Additional props passed to fallback component */
  fallbackProps?: Record<string, any>;
}

export interface ErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;

  /** The error that was caught */
  error?: Error;

  /** Additional error information */
  errorInfo?: ErrorInfo;

  /** Error timestamp for tracking */
  errorTime?: Date;

  /** Error ID for tracking in logs */
  errorId?: string;
}

export interface ErrorFallbackProps {
  /** The error that was caught */
  error: Error;

  /** Additional error information */
  errorInfo?: ErrorInfo;

  /** Function to reset error state and retry */
  resetError: () => void;

  /** Function to navigate to home page */
  goHome: () => void;

  /** Function to report error for debugging */
  reportError: () => void;

  /** Additional props passed from parent */
  [key: string]: any;
}

// ============================================================================
// Error Boundary Component
// ============================================================================

/**
 * Default error fallback component
 */
export const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  goHome,
  reportError,
  showDetails = false,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isReporting, setIsReporting] = React.useState(false);

  const handleReportError = async () => {
    try {
      setIsReporting(true);
      await reportError(error, {
        componentStack: errorInfo?.componentStack,
        errorBoundary: true,
      });
      // Show success feedback
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="error-fallback" data-testid="error-fallback">
      <div className="error-fallback__content">
        <div className="error-fallback__icon">
          <AlertCircle size={48} color="var(--color-error)" />
        </div>

        <div className="error-fallback__header">
          <h1 className="error-fallback__title">Oops! Something went wrong</h1>
          <p className="error-fallback__subtitle">
            We're sorry, but something unexpected happened. Please try refreshing the page.
          </p>
        </div>

        <div className="error-fallback__actions">
          <Button variant="primary" onClick={resetError} className="error-fallback__action">
            <RefreshCw size={16} />
            Try Again
          </Button>

          <Button variant="secondary" onClick={goHome} className="error-fallback__action">
            <Home size={16} />
            Go Home
          </Button>

          <Button
            variant="tertiary"
            onClick={handleReportError}
            disabled={isReporting}
            className="error-fallback__action"
          >
            <Bug size={16} />
            {isReporting ? 'Reporting...' : 'Report Issue'}
          </Button>
        </div>

        {showDetails && process.env.NODE_ENV === 'development' && (
          <div className="error-fallback__details">
            <button onClick={() => setIsExpanded(!isExpanded)} className="error-fallback__toggle">
              {isExpanded ? 'Hide' : 'Show'} Error Details
            </button>

            {isExpanded && (
              <div className="error-fallback__stack">
                <div className="error-fallback__error">
                  <h3>Error Message:</h3>
                  <pre>{error.message}</pre>
                </div>

                {error.stack && (
                  <div className="error-fallback__stack-trace">
                    <h3>Stack Trace:</h3>
                    <pre>{error.stack}</pre>
                  </div>
                )}

                {errorInfo?.componentStack && (
                  <div className="error-fallback__component-stack">
                    <h3>Component Stack:</h3>
                    <pre>{errorInfo.componentStack}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Main Error Boundary Component
// ============================================================================

/**
 * Comprehensive error boundary for React components
 *
 * @description
 * Provides robust error handling for React component trees with automatic
 * error reporting, customizable fallbacks, and development tooling support.
 *
 * @features
 * - Automatic error catching and handling
 * - Error reporting integration
 * - Customizable fallback UI
 * - Error recovery mechanisms
 * - Development debugging support
 * - Accessibility considerations
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * // With custom fallback
 * <ErrorBoundary
 *   fallback={CustomErrorComponent}
 *   errorReporting={{ enabled: true, level: 'error' }}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  /** Component display name for React DevTools */
  static displayName = 'ErrorBoundary';

  /** Default props for the component */
  static defaultProps: Partial<ErrorBoundaryProps> = {
    fallback: DefaultErrorFallback,
    errorReporting: {
      enabled: true,
      level: 'error',
    },
    showDetails: false,
    className: '',
    fallbackProps: {},
  };

  /**
   * Constructor
   *
   * @param props - Component props
   */
  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
    };

    // Bind methods
    this.handleResetError = this.handleResetError.bind(this);
    this.handleGoHome = this.handleGoHome.bind(this);
    this.handleReportError = this.handleReportError.bind(this);
  }

  /**
   * Update state when an error occurs
   *
   * @description
   * Static method called by React when an error occurs. Creates a new error ID
   * for tracking and logs the error for debugging purposes.
   *
   * @param error - The error that occurred
   * @returns New state with error information
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Generate unique error ID for tracking
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.error('Error Boundary caught an error', {
      errorId,
      message: error.message,
      stack: error.stack,
    });

    return {
      hasError: true,
      error,
      errorTime: new Date(),
      errorId,
    };
  }

  /**
   * Log error details to external services
   *
   * @description
   * Called by React when an error occurs and after getDerivedStateFromError.
   * Provides access to error information and component stack for debugging.
   *
   * @param error - The error that occurred
   * @param errorInfo - Additional error information including component stack
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { errorReporting } = this.props;

    // Update state with error info
    this.setState({ errorInfo });

    // Log error locally
    logger.error('Error Boundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
    });

    // Report to external service if enabled
    if (errorReporting?.enabled) {
      this.reportError(error, {
        errorInfo,
        level: errorReporting.level || 'error',
        context: errorReporting.context,
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      });
    }

    // In development, also log to console for easier debugging
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught an Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.groupEnd();
    }
  }

  /**
   * Reset error state and retry rendering
   *
   * @description
   * Resets the error boundary state, clearing the error and allowing
   * the component tree to re-render. Useful for retry mechanisms.
   */
  handleResetError(): void {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorTime: undefined,
      errorId: undefined,
    });
  }

  /**
   * Navigate to home page
   *
   * @description
   * Navigate user to the home page, clearing the current error state.
   * Typically used in error fallbacks to provide a recovery path.
   */
  handleGoHome(): void {
    this.handleResetError();
    window.location.href = '/';
  }

  /**
   * Report error to monitoring service
   *
   * @description
   * Manually report an error to the error reporting service. Can be called
   * from fallback UI or programmatically for additional error logging.
   *
   * @param error - Error to report
   * @param context - Additional context information
   */
  async handleReportError(
    error: Error = this.state.error!,
    context: Record<string, any> = {}
  ): Promise<void> {
    const { errorReporting } = this.props;

    if (!errorReporting?.enabled) {
      logger.warn('Error reporting is disabled');
      return;
    }

    try {
      await this.reportError(error, context);
    } catch (reportingError) {
      logger.error('Failed to report error to monitoring service', reportingError);
    }
  }

  /**
   * Internal method to report errors
   *
   * @private
   */
  private async reportError(error: Error, context: Record<string, any>): Promise<void> {
    await reportError(error, {
      ...context,
      errorBoundary: true,
      componentStack: context.componentStack || this.state.errorInfo?.componentStack,
    });
  }

  /**
   * Render the error boundary
   *
   * @returns Component tree or error fallback
   */
  render(): ReactNode {
    const {
      children,
      fallback: FallbackComponent = DefaultErrorFallback,
      showDetails,
      className,
      fallbackProps,
    } = this.props;

    const { hasError, error, errorInfo, errorTime, errorId } = this.state;

    // If no error, render children normally
    if (!hasError) {
      return children;
    }

    // Validate that error exists before rendering fallback
    if (!error) {
      logger.error('Error boundary rendered without error object');
      return (
        <div className={`error-fallback ${className || ''}`}>
          <h1>Something went wrong</h1>
          <p>An unknown error occurred.</p>
          <button onClick={this.handleResetError}>Try Again</button>
        </div>
      );
    }

    // Check if fallback component is valid
    if (!isValidElement(FallbackComponent) && typeof FallbackComponent !== 'function') {
      logger.error('Invalid fallback component provided to ErrorBoundary');
      return <DefaultErrorFallback {...this.getFallbackProps()} />;
    }

    // Render fallback component with error information
    const fallbackProps_to_pass = this.getFallbackProps();

    return (
      <div className={`error-boundary ${className || ''}`}>
        {isValidElement(FallbackComponent) ? (
          React.cloneElement(FallbackComponent, fallbackProps_to_pass)
        ) : (
          <FallbackComponent {...fallbackProps_to_pass} />
        )}
      </div>
    );
  }

  /**
   * Get props to pass to fallback component
   *
   * @private
   * @returns Props for fallback component
   */
  private getFallbackProps(): ErrorFallbackProps & { showDetails?: boolean } {
    const { error, errorInfo, errorTime, errorId } = this.state;

    const { showDetails, fallbackProps = {} } = this.props;

    return {
      error: error!,
      errorInfo,
      errorTime,
      errorId,
      showDetails,
      resetError: this.handleResetError,
      goHome: this.handleGoHome,
      reportError: this.handleReportError,
      ...fallbackProps,
    };
  }
}

// ============================================================================
// CSS Styles (if using CSS modules or styled-components)
// ============================================================================

/*
.error-fallback {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 2rem;
  background: var(--color-surface);
  border-radius: var(--border-radius-lg);
  text-align: center;
}

.error-fallback__content {
  max-width: 500px;
}

.error-fallback__icon {
  margin-bottom: 1.5rem;
}

.error-fallback__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.error-fallback__subtitle {
  color: var(--color-text-secondary);
  margin-bottom: 2rem;
}

.error-fallback__actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.error-fallback__action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-fallback__details {
  margin-top: 2rem;
  text-align: left;
}

.error-fallback__toggle {
  background: none;
  border: 1px solid var(--color-border);
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  cursor: pointer;
  color: var(--color-text-secondary);
}

.error-fallback__stack {
  margin-top: 1rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 1rem;
  font-size: 0.875rem;
}

.error-fallback__stack pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: var(--font-mono);
  color: var(--color-text-secondary);
}
*/

// ============================================================================
// Export
// ============================================================================

export default ErrorBoundary;
export type { ErrorBoundaryProps, ErrorBoundaryState, ErrorFallbackProps };
