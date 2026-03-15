// @ts-nocheck
/**
 * Modal Components - Chakra-compatible Modal system for The New Fuse
 * Provides Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton
 */

import { cn } from '@/lib/utils';
import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';

// Modal Props
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | 'full';
}

// Main Modal Component (simple version)
export const Modal = ({ isOpen, onClose, children, size = 'md' }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1040] overflow-y-auto">
      <ModalOverlay onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <ModalContent size={size} onClick={(e) => e.stopPropagation()}>
          {children}
        </ModalContent>
      </div>
    </div>
  );
};

// Modal Overlay
export const ModalOverlay = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity', className)}
      {...props}
    />
  )
);
ModalOverlay.displayName = 'ModalOverlay';

// Modal Content
export const ModalContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { size?: ModalProps['size'] }
>(({ className, size = 'md', ...props }, ref) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    full: 'max-w-full',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'relative w-full transform overflow-hidden rounded-md bg-transparent dark:bg-transparent text-left shadow-none transition-all',
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
});
ModalContent.displayName = 'ModalContent';

// Modal Header
export const ModalHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('border-b border-neutral-200 dark:border-neutral-700 px-3 py-2', className)}
      {...props}
    />
  )
);
ModalHeader.displayName = 'ModalHeader';

// Modal Body
export const ModalBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-3 py-2', className)} {...props} />
  )
);
ModalBody.displayName = 'ModalBody';

// Modal Footer
export const ModalFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'border-t border-neutral-200 dark:border-neutral-700 px-3 py-2 flex gap-2 justify-end',
        className
      )}
      {...props}
    />
  )
);
ModalFooter.displayName = 'ModalFooter';

// Modal Close Button
export const ModalCloseButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-label="Close"
    className={cn(
      'absolute top-4 right-4 text-gray-400 hover:text-muted-foreground dark:hover:text-gray-300 transition-colors',
      className
    )}
    {...props}
  >
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
));
ModalCloseButton.displayName = 'ModalCloseButton';
