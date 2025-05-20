import React, { Component } from 'react';
class ErrorBoundary extends Component {
    constructor() {
        super(...arguments);
        this.state = {
            hasError: false,
            error: null,
        };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }
    render() {
        var _a;
        if (this.state.hasError) {
            return (<div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <h1 className="text-4xl font-bold text-destructive mb-4">Oops! Something went wrong</h1>
          <p className="text-lg text-muted-foreground mb-8">
            {((_a = this.state.error) === null || _a === void 0 ? void 0 : _a.message) || 'An unexpected error occurred'}
          </p>
          <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md" onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>);
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
//# sourceMappingURL=index.js.map