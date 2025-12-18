import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-boundary">
            <div className="error-content">
              <h2>⚠️ Something went wrong</h2>
              <p>The application encountered an unexpected error.</p>
              {this.state.error && <pre className="error-details">{this.state.error.message}</pre>}
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="retry-button"
              >
                Try Again
              </button>
            </div>
            <style>{`
              .error-boundary {
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background: var(--tnf-obsidian, #020617);
                color: var(--tnf-text-primary, #f8fafc);
                font-family: var(--tnf-font-body, 'Plus Jakarta Sans', sans-serif);
              }
              .error-content {
                text-align: center;
                padding: 2rem;
                background: var(--tnf-surface, rgba(255, 255, 255, 0.02));
                border: 1px solid var(--tnf-border, rgba(255, 255, 255, 0.08));
                border-radius: 1rem;
                max-width: 500px;
              }
              .error-content h2 {
                margin-bottom: 1rem;
                color: var(--tnf-error, #ef4444);
              }
              .error-details {
                background: rgba(0, 0, 0, 0.3);
                padding: 1rem;
                border-radius: 0.5rem;
                font-size: 0.875rem;
                margin: 1rem 0;
                overflow-x: auto;
              }
              .retry-button {
                background: linear-gradient(135deg, var(--tnf-primary-start, #667eea), var(--tnf-primary-end, #764ba2));
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 0.5rem;
                cursor: pointer;
                font-weight: 600;
                transition: transform 0.2s, box-shadow 0.2s;
              }
              .retry-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 0 20px rgba(124, 58, 237, 0.3);
              }
            `}</style>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
