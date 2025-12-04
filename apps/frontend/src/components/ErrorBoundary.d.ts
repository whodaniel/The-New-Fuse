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
import React, { Component, ErrorInfo, ReactNode } from 'react';
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
/**
 * Default error fallback component
 */
export declare const DefaultErrorFallback: React.FC<ErrorFallbackProps>;
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
export declare class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    /** Component display name for React DevTools */
    static displayName: string;
    /** Default props for the component */
    static defaultProps: Partial<ErrorBoundaryProps>;
    /**
     * Constructor
     *
     * @param props - Component props
     */
    constructor(props: ErrorBoundaryProps);
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
    static getDerivedStateFromError(error: Error): ErrorBoundaryState;
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
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void;
    /**
     * Reset error state and retry rendering
     *
     * @description
     * Resets the error boundary state, clearing the error and allowing
     * the component tree to re-render. Useful for retry mechanisms.
     */
    handleResetError(): void;
    /**
     * Navigate to home page
     *
     * @description
     * Navigate user to the home page, clearing the current error state.
     * Typically used in error fallbacks to provide a recovery path.
     */
    handleGoHome(): void;
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
    handleReportError(error?: Error, context?: Record<string, any>): Promise<void>;
    /**
     * Internal method to report errors
     *
     * @private
     */
    private reportError;
    /**
     * Render the error boundary
     *
     * @returns Component tree or error fallback
     */
    render(): ReactNode;
    /**
     * Get props to pass to fallback component
     *
     * @private
     * @returns Props for fallback component
     */
    private getFallbackProps;
}
export default ErrorBoundary;
export type { ErrorBoundaryProps, ErrorBoundaryState, ErrorFallbackProps };
