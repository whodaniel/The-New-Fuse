import { Component, ErrorInfo, ReactNode } from 'react';
interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    isolate?: boolean;
}
interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    errorId: string | null;
}
declare class ErrorBoundary extends Component<Props, State> {
    private retryCount;
    private readonly maxRetries;
    constructor(props: Props);
    static getDerivedStateFromError(error: Error): Partial<State>;
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void;
    private handleRetry;
    private handleReload;
    render(): ReactNode;
}
export default ErrorBoundary;
