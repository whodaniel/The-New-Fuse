import React from 'react';

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
}

interface DialogHeaderProps {
  children: React.ReactNode;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogDescriptionProps {
  children: React.ReactNode;
}

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogTriggerProps {
  _asChild?: boolean;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ className = "", children }: DialogContentProps) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}

export function DialogHeader({ children }: DialogHeaderProps) {
  return (
    <div className="mb-4">
      {children}
    </div>
  );
}

export function DialogTitle({ children, className = "" }: DialogTitleProps) {
  return (
    <h2 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h2>
  );
}

export function DialogDescription({ children }: DialogDescriptionProps) {
  return (
    <p className="text-sm text-gray-600 mt-2">
      {children}
    </p>
  );
}

export function DialogFooter({ children, className = "" }: DialogFooterProps) {
  return (
    <div className={`flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

export function DialogTrigger({ _asChild, children }: DialogTriggerProps) {
  return <>{children}</>;
}

interface DialogCloseProps {
  _asChild?: boolean;
  children: React.ReactNode;
}

export function DialogClose({ _asChild, children }: DialogCloseProps) {
  return <>{children}</>;
}

export default Dialog;

// Named exports for compound component pattern
export const Root = Dialog;
export const Content = DialogContent;
export const Header = DialogHeader;
export const Title = DialogTitle;
export const Description = DialogDescription;
export const Footer = DialogFooter;
export const Trigger = DialogTrigger;
export const Close = DialogClose;
