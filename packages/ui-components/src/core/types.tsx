import * as React from 'react';

export type ToastProps = {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: 'default' | 'destructive' | 'success' | 'info' | 'warning';
  duration?: number;
  className?: string;
};

export type ToastActionElement = React.ReactElement<{
  onClick?: () => void;
  className?: string;
  altText?: string;
}>;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive' | 'success' | 'warning';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
  className?: string;
  asChild?: boolean;
  icon?: React.ReactElement;
}

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  showValue?: boolean;
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning';
  size?: 'default' | 'sm' | 'lg';
}

export interface DialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children?: React.ReactNode;
  className?: string;
}

export interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
  className?: string;
}

export interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

export interface DialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

// Additional exported types needed by index.ts
export type ExtendedButtonProps = ButtonProps;
export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactElement;
  rightIcon?: React.ReactElement;
};
export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  className?: string;
  optional?: boolean;
};
export type SwitchProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> & {
  className?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  onChange?: React.FormEventHandler<HTMLButtonElement>;
};
export type ToastVariant = 'default' | 'destructive' | 'success' | 'info' | 'warning';
export type ToasterToast = ToastProps & {
  id: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};
export type ToastActionType = 'foreground' | 'background';

// Additional missing types for UIModule exports
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
  placeholder?: string;
}

export interface ListProps extends React.HTMLAttributes<HTMLUListElement> {
  className?: string;
  variant?: 'default' | 'ordered';
}

export interface ListItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  className?: string;
}

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  fallback?: string;
}

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'default' | 'text' | 'circular' | 'rectangular';
}

export interface DateRangePickerProps {
  value?: { from: Date; to: Date };
  onChange?: (range: { from: Date; to: Date }) => void;
  placeholder?: string;
}

export interface ModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
  className?: string;
}
