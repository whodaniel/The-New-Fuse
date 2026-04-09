import React, { useEffect } from 'react';

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
  asChild?: boolean;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (open && e.key === 'Escape') {
        onOpenChange?.(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      // Lock body scroll when dialog is open, but save original style
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = originalOverflow;
      };
    }

    // Cleanup if component unmounts without running the effect cleanup above (e.g. if open was false)
    // Actually, the effect cleanup runs when 'open' changes or component unmounts.
    // But if open is false, we didn't set the listener or style.

    // Simpler logic:
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={() => onOpenChange?.(false)}
        aria-hidden="true"
      />
      <div
        className="relative bg-transparent rounded-md shadow-none max-w-md w-full mx-4"
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ className = '', children }: DialogContentProps) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function DialogHeader({ children }: DialogHeaderProps) {
  return <div className="mb-4">{children}</div>;
}

export function DialogTitle({ children, className = '' }: DialogTitleProps) {
  return <h2 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h2>;
}

export function DialogDescription({ children }: DialogDescriptionProps) {
  return <p className="text-sm text-gray-600 mt-2">{children}</p>;
}

export function DialogFooter({ children, className = '' }: DialogFooterProps) {
  return (
    <div className={`flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

export function DialogTrigger({ asChild, children }: DialogTriggerProps) {
  void asChild;
  return <>{children}</>;
}

interface DialogCloseProps {
  asChild?: boolean;
  children: React.ReactNode;
}

export function DialogClose({ asChild, children }: DialogCloseProps) {
  void asChild;
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
