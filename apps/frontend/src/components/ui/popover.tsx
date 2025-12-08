/**
 * Popover Component - Chakra-compatible Popover for The New Fuse
 */

import React, { useState, useRef, useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  isOpen?: boolean;
  onClose?: () => void;
  closeOnBlur?: boolean;
  className?: string;
}

export const Popover = ({
  trigger,
  children,
  placement = 'bottom',
  isOpen: controlledIsOpen,
  onClose,
  closeOnBlur = true,
  className,
}: PopoverProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = onClose ? () => onClose() : setInternalIsOpen;

  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && triggerRef.current && popoverRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();

      let top = 0;
      let left = 0;

      switch (placement) {
        case 'top':
          top = triggerRect.top - popoverRect.height - 8;
          left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
          break;
        case 'bottom':
          top = triggerRect.bottom + 8;
          left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
          break;
        case 'left':
          top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
          left = triggerRect.left - popoverRect.width - 8;
          break;
        case 'right':
          top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
          left = triggerRect.right + 8;
          break;
      }

      setPosition({ top, left });
    }
  }, [isOpen, placement]);

  useEffect(() => {
    if (closeOnBlur && isOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          popoverRef.current &&
          !popoverRef.current.contains(event.target as Node) &&
          triggerRef.current &&
          !triggerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [closeOnBlur, isOpen, setIsOpen]);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-block cursor-pointer"
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={popoverRef}
          className={cn(
            'fixed z-[1050] bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700',
            'animate-in fade-in-0 zoom-in-95 duration-200',
            className
          )}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {children}
        </div>
      )}
    </>
  );
};

export const PopoverTrigger = ({ children }: { children: ReactNode }) => <>{children}</>;
export const PopoverContent = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('p-4', className)}>{children}</div>
);
export const PopoverHeader = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('px-4 pt-4 pb-2 font-semibold border-b border-neutral-200 dark:border-neutral-700', className)}>
    {children}
  </div>
);
export const PopoverBody = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('p-4', className)}>{children}</div>
);
export const PopoverFooter = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('px-4 pb-4 pt-2 border-t border-neutral-200 dark:border-neutral-700', className)}>
    {children}
  </div>
);
export const PopoverCloseButton = ({ onClick, className }: { onClick?: () => void; className?: string }) => (
  <button
    onClick={onClick}
    className={cn('absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors', className)}
  >
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
);
