/**
 * Menu Component - Chakra-compatible Menu/Dropdown for The New Fuse
 */

import React, { useState, useRef, useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MenuProps {
  children: ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  closeOnSelect?: boolean;
}

export const Menu = ({ children, isOpen: controlledIsOpen, onClose, closeOnSelect = true }: MenuProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = onClose ? () => onClose() : setInternalIsOpen;

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, setIsOpen]);

  return (
    <div ref={menuRef} className="relative inline-block">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, { isOpen, setIsOpen, closeOnSelect });
        }
        return child;
      })}
    </div>
  );
};

export const MenuButton = ({
  children,
  isOpen,
  setIsOpen,
  className,
}: {
  children: ReactNode;
  isOpen?: boolean;
  setIsOpen?: (value: boolean) => void;
  className?: string;
}) => (
  <button
    onClick={() => setIsOpen?.(!isOpen)}
    className={cn('inline-flex items-center justify-center', className)}
  >
    {children}
  </button>
);

export const MenuList = ({
  children,
  isOpen,
  setIsOpen,
  closeOnSelect,
  className,
}: {
  children: ReactNode;
  isOpen?: boolean;
  setIsOpen?: (value: boolean) => void;
  closeOnSelect?: boolean;
  className?: string;
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 py-1 z-[1050]',
        'animate-in fade-in-0 zoom-in-95 duration-200',
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, { setIsOpen, closeOnSelect });
        }
        return child;
      })}
    </div>
  );
};

export const MenuItem = ({
  children,
  onClick,
  setIsOpen,
  closeOnSelect,
  icon,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  setIsOpen?: (value: boolean) => void;
  closeOnSelect?: boolean;
  icon?: ReactNode;
  className?: string;
}) => (
  <button
    onClick={() => {
      onClick?.();
      if (closeOnSelect) {
        setIsOpen?.(false);
      }
    }}
    className={cn(
      'w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex items-center gap-2',
      className
    )}
  >
    {icon && <span className="flex-shrink-0">{icon}</span>}
    <span>{children}</span>
  </button>
);

export const MenuDivider = ({ className }: { className?: string }) => (
  <div className={cn('my-1 border-t border-neutral-200 dark:border-neutral-700', className)} />
);

export const MenuGroup = ({ title, children, className }: { title?: string; children: ReactNode; className?: string }) => (
  <div className={cn('py-1', className)}>
    {title && <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">{title}</div>}
    {children}
  </div>
);
