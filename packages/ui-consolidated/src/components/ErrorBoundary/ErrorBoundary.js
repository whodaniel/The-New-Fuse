import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
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
            return (_jsxs("div", { className: "flex flex-col items-center justify-center min-h-screen p-4 text-center", children: [_jsx("h1", { className: "text-4xl font-bold text-destructive mb-4", children: "Oops! Something went wrong" }), _jsx("p", { className: "text-lg text-muted-foreground mb-8", children: ((_a = this.state.error) === null || _a === void 0 ? void 0 : _a.message) || 'An unexpected error occurred' }), _jsx("button", { className: "bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md", onClick: () => window.location.reload(), children: "Reload Page" })] }));
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
export { ErrorBoundary };
