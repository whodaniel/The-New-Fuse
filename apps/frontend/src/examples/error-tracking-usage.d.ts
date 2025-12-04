declare function fetchUserData(userId: string): Promise<any>;
declare function validateUserForm(formData: Record<string, unknown>): boolean;
declare class AuthService {
    login(credentials: {
        email: string;
        password: string;
    }): Promise<void>;
}
import { Component, ErrorInfo, ReactNode } from 'react';
interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}
interface ErrorBoundaryState {
    hasError: boolean;
}
declare class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: {
        hasError: boolean;
    };
    static getDerivedStateFromError(): ErrorBoundaryState;
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void;
    render(): ReactNode;
}
import { Dispatch, AnyAction } from 'redux';
declare const fetchDataAction: () => (dispatch: Dispatch<AnyAction>) => Promise<void>;
declare class WebSocketService {
    private setupErrorHandling;
}
declare class DatabaseService {
    query(sql: string, params: unknown[]): Promise<unknown>;
}
declare function uploadFile(file: File): Promise<void>;
declare class SessionManager {
    trackSessionError(error: Error, userId: string): void;
    private getSessionId;
}
interface PerformanceMetric {
    name: string;
    value: number;
    threshold: number;
}
declare class PerformanceMonitor {
    trackPerformanceIssue(metric: PerformanceMetric): void;
}
export { fetchUserData, validateUserForm, AuthService, ErrorBoundary, fetchDataAction, WebSocketService, DatabaseService, uploadFile, SessionManager, PerformanceMonitor };
