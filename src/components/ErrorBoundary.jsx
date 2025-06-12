import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error("Uncaught error:", error, errorInfo);
    // You could also log the error to an error reporting service here
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600">Something went wrong.</h1>
          <p className="mt-2 text-gray-700">Please try refreshing the page or contact support if the issue persists.</p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="mt-4 text-left text-sm bg-gray-100 p-4 rounded overflow-auto">
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}