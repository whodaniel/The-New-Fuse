// This file is kept for backward compatibility
// It re-exports the consolidated Modal component from ui-components
import React from 'react';
import { Modal as ConsolidatedModal, type ModalProps as ConsolidatedModalProps, DialogHeader, DialogTitle, DialogFooter } from '@the-new-fuse/ui-components/src/core/dialog';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';
type PositionStrategy = 'center' | 'top' | 'bottom' | 'custom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: ModalSize;
  position?: PositionStrategy;
  customPosition?: { top?: string; left?: string; right?: string; bottom?: string };
  animationPreset?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  children: React.ReactNode;
}

/**
 * Modal component that wraps the consolidated Modal component
 * This maintains backward compatibility with the old Modal API
 */
export const Modal = ({
  isOpen,
  onClose,
  size = 'md',
  position = 'center',
  customPosition,
  animationPreset, // Accept animationPreset prop even if unused
  closeOnBackdropClick = true,
  closeOnEscape = true,
  children,
}: ModalProps) => {
  // Map the old size values to the new size values
  const sizeMap: Record<ModalSize, ConsolidatedModalProps['size']> = {
    'sm': 'sm',
    'md': 'default',
    'lg': 'lg',
    'xl': 'xl'
  };

  // Map the old position values to the new position values
  const positionMap: Record<PositionStrategy, ConsolidatedModalProps['position']> = {
    'center': 'default',
    'top': 'top',
    'bottom': 'bottom',
    'custom': 'custom'
  };

  // Convert customPosition from object to React.CSSProperties
  const cssCustomPosition = {
    top: customPosition?.top || 'auto',
    left: customPosition?.left || 'auto'
  } as { top?: string; left?: string }; // Cast to the expected type with string values

  return (
    <ConsolidatedModal
      isOpen={isOpen}
      onClose={onClose}
      size={sizeMap[size]}
      position={positionMap[position]}
      customPosition={cssCustomPosition}
      closeOnBackdropClick={closeOnBackdropClick}
      closeOnEscape={closeOnEscape}
    >
      {children}
    </ConsolidatedModal>
  );
};

// Create Header and Footer components to maintain backwards compatibility
const Header: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => {
  return (
    <DialogHeader className={`modal-header ${className || ''}`} {...props}>
      <DialogTitle>{children}</DialogTitle>
    </DialogHeader>
  );
};

const Footer: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => {
  return (
    <DialogFooter className={`modal-footer ${className || ''}`} {...props}>
      {children}
    </DialogFooter>
  );
};

// Attach components for compatibility with legacy code
Modal.Header = Header;
Modal.Footer = Footer;