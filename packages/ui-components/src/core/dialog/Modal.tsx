import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './index';

export interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  size?: 'sm' | 'default' | 'lg' | 'fullscreen';
  position?: 'default' | 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
  className?: string;
}

export const DialogModal = ({
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

DialogModal.displayName = 'DialogModal';

export default DialogModal;
export { DialogModal as Modal };
