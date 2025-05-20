import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './index.js';

export interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  size?: 'sm' | 'default' | 'lg' | 'fullscreen';
  position?: 'default' | 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
  className?: string;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  size = 'default',
  position = 'default',
  children,
  className,
}: ModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent 
        size={size} 
        position={position} 
        className={className}
        onClose={onClose}
      >
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
};

Modal.displayName = 'Modal';

export default Modal;
