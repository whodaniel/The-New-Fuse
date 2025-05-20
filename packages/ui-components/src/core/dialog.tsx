// This file is deprecated and will be removed in a future version
// Please use the Dialog component from ./dialog/index.tsx instead

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../utils/cn.js'; // Fixed import path
import { Modal as NewModal } from './dialog/Modal.js';

// Re-export the types for backward compatibility
export interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  size?: 'default' | 'sm' | 'lg' | 'fullscreen' | 'xl'; // Added 'xl' as valid size
  position?: 'default' | 'top' | 'bottom' | 'left' | 'right' | 'custom'; // Added 'custom' as valid position
  children: React.ReactNode;
  className?: string;
  customPosition?: { top?: string; left?: string }; // Kept as string type for consistency
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  animationPreset?: 'simple-fade' | 'complex-scale';
}

// Create a component that uses the new Dialog component
export const Modal = ({
  isOpen,
  onClose,
  title,
  size = 'default',
  position = 'default',
  children,
  className,
  ...props
}: ModalProps) => (
  <NewModal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    size={size as 'sm' | 'default' | 'lg' | 'fullscreen'}
    position={position as 'default' | 'top' | 'bottom' | 'left' | 'right'}
    className={className}
  >
    {children}
  </NewModal>
);

Modal.displayName = 'Modal';

// For backward compatibility
const ModalHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('px-6 py-4 border-b modal-header', className)}
    {...props}
  />
);

ModalHeader.displayName = 'ModalHeader';

const ModalFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('px-6 py-4 border-t modal-footer', className)}
    {...props}
  />
);

ModalFooter.displayName = 'ModalFooter';

// Attach components for backward compatibility
Modal.Header = ModalHeader;
Modal.Footer = ModalFooter;

// Import directly from their source files to avoid circular dependencies
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from './dialog/index.js';

// Export them for direct use
export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose
};