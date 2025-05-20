import { Component } from 'react';
declare class ErrorBoundary extends Component {
    constructor();
    static getDerivedStateFromError(error: any): {
        hasError: boolean;
        error: any;
    };
    componentDidCatch(error: any, errorInfo: any): void;
    render(): boolean | undefined;
}
export default ErrorBoundary;
