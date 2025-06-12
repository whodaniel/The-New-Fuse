import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
import { Box, Typography, Button } from '@mui/material';
class ErrorBoundary extends Component {
    constructor() {
        super(...arguments);
        this.state = {
            hasError: false,
        };
        this.handleReload = () => {
            // Attempt to reload the extension's popup
            // For a popup, usually closing and reopening is the way.
            // Alternatively, can try to force a re-render if the error is recoverable.
            // For simplicity, we'll just log and show a message.
            // A more robust solution might involve chrome.runtime.reload() for the whole extension,
            // but that's too disruptive for a popup error.
            this.setState({ hasError: false, error: undefined, errorInfo: undefined });
            // Or, if you want to try reloading the popup window:
            // window.location.reload(); // This might not work as expected in all popup contexts
        };
    }
    static getDerivedStateFromError(_) {
        return { hasError: true };
    }
    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error in popup:", error, errorInfo);
        // Here you could also send the error to a logging service
    }
    render() {
        if (this.state.hasError) {
            return (_jsxs(Box, { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", p: 2, textAlign: "center", children: [_jsx(Typography, { variant: "h5", color: "error", gutterBottom: true, children: "Oops! Something went wrong." }), _jsx(Typography, { variant: "body1", gutterBottom: true, children: "An unexpected error occurred in the extension popup." }), process.env.NODE_ENV === 'development' && this.state.error && (_jsxs(Box, { mt: 2, p: 2, bgcolor: "grey.200", borderRadius: 1, width: "100%", overflow: "auto", children: [_jsx(Typography, { variant: "caption", display: "block", gutterBottom: true, children: this.state.error.toString() }), this.state.errorInfo && (_jsx("pre", { style: { whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.75rem' }, children: this.state.errorInfo.componentStack }))] })), _jsx(Button, { variant: "contained", onClick: this.handleReload, sx: { mt: 2 }, children: "Try to Recover" })] }));
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
//# sourceMappingURL=ErrorBoundary.js.map