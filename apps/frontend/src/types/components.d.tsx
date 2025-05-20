import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from 'react';
export interface BaseProps {
    className?: string;
    children?: ReactNode;
}
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, BaseProps {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    isLoading?: boolean;
}
export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, BaseProps {
    error?: string;
    label?: string;
}
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, BaseProps {
    options: Array<{
        value: string;
        label: string;
    }>;
    label?: string;
    error?: string;
}
export interface CardProps extends BaseProps {
    title?: string;
    footer?: ReactNode;
    header?: ReactNode;
}
export interface DialogProps extends BaseProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    title?: string;
}
export interface LayoutProps extends BaseProps {
    header?: ReactNode;
    footer?: ReactNode;
    sidebar?: ReactNode;
}
export interface NavItemProps extends BaseProps {
    href: string;
    icon?: ReactNode;
    active?: boolean;
}
export interface FormFieldProps extends BaseProps {
    label: string;
    error?: string;
    required?: boolean;
}
export interface TableProps extends BaseProps {
    headers: string[];
    rows: Record<string, unknown>[];
    onRowClick?: (row: Record<string, unknown>) => void;
}
export interface ChartProps extends BaseProps {
    data: Array<{
        label: string;
        value: number;
        color?: string;
    }>;
    type?: 'line' | 'bar' | 'pie';
    options?: {
        title?: string;
        xAxis?: string;
        yAxis?: string;
        legend?: boolean;
    };
}
export interface ModalProps extends BaseProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
}
export interface ToastProps extends BaseProps {
    type?: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
}
export interface Theme {
    mode: 'light' | 'dark';
    primary: string;
    secondary: string;
    background: string;
    text: string;
    error: string;
    warning: string;
    success: string;
    info: string;
}
export interface User {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    role: 'user' | 'admin';
}
export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}
export interface ApiResponse<T = any> {
    data?: T;
    error?: string;
    status: number;
}
export interface Workspace {
    id: string;
    name: string;
    description?: string;
    members: User[];
    createdAt: string;
    updatedAt: string;
}
export interface Agent {
    id: string;
    name: string;
    description?: string;
    type: string;
    status: 'active' | 'inactive' | 'error';
    configuration: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}
export interface Message {
    id: string;
    content: string;
    sender: User | Agent;
    timestamp: string;
    type: 'text' | 'image' | 'file' | 'system';
    metadata?: Record<string, any>;
}
