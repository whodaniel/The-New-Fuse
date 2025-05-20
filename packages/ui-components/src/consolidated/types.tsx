import { ReactNode, HTMLAttributes, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, LabelHTMLAttributes } from 'react';
import { VariantProps } from 'class-variance-authority';
import { buttonVariants } from './Button.js';

// Base Props interface that all component props extend
export interface BaseProps {
  className?: string;
  children?: ReactNode;
}

// Button Types
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'start' | 'end';
}

// Card Types
export interface CardProps extends HTMLAttributes<HTMLDivElement>, BaseProps {
  title?: ReactNode;
  footer?: ReactNode;
  header?: ReactNode;
  variant?: 'default' | 'destructive' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  hover?: boolean;
  clickable?: boolean;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement>, BaseProps {}
export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement>, BaseProps {}
export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement>, BaseProps {}
export interface CardContentProps extends HTMLAttributes<HTMLDivElement>, BaseProps {}
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement>, BaseProps {}

// Label Types
export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement>, BaseProps {
  required?: boolean;
  htmlFor?: string;
}

// Input Types
export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, BaseProps {
  label?: string;
  error?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

// Select Types
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, BaseProps {
  options: Array<{ value: string; label: string }>;
  label?: string;
  error?: string;
}

// Dialog Types
export interface DialogProps extends BaseProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
}

// Modal Types
export interface ModalProps extends BaseProps {
  open?: boolean;
  onClose?: () => void;
  title?: string;
  footer?: ReactNode;
}

// Toast Types
export interface ToastProps extends BaseProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}
