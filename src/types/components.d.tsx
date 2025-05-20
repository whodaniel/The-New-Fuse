import { ReactNode } from "react";
import { User } from './index.js';
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
}
export interface AuthComponentProps extends BaseComponentProps {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
  onLogout: () => Promise<void>;
  onRegister: (email: string, password: string, name: string) => Promise<void>;
}
export interface ChatComponentProps extends BaseComponentProps {
  messages: Array<{
    id: string;
    content: string;
    sender: string;
    timestamp: Date;
  }>;
  onSendMessage: (content: string) => Promise<void>;
  onDeleteMessage: (id: string) => Promise<void>;
  loading: boolean;
}
export interface ModuleComponentProps extends BaseComponentProps {
  enabled: boolean;
  config?: Record<string, unknown>;
  onConfigChange?: (config: Record<string, unknown>) => void;
}
export interface ThemeComponentProps extends BaseComponentProps {
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
}
export interface ToastProps extends BaseComponentProps {
  type: "success" | "error" | "info" | "warning";
  message: string;
  duration?: number;
  onClose: () => void;
}
export interface FormComponentProps extends BaseComponentProps {
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  initialValues?: Record<string, unknown>;
  validationSchema?: Record<string, unknown>;
  loading?: boolean;
}
export interface ButtonProps extends BaseComponentProps {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}
export interface InputProps extends BaseComponentProps {
  type?: "text" | "password" | "email" | "number";
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}
