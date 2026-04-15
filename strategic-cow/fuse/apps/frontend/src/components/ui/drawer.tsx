// @ts-nocheck
/**
 * Drawer Component - Custom implementation for The New Fuse Design System
 * Replaces Chakra UI Drawer with Tailwind CSS
 */
import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  placement?: 'left' | 'right' | 'top' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  title?: string;
}

const Drawer = ({
  isOpen,
  onClose,
  children,
  placement = 'right',
  size = 'md',
  title,
}: DrawerProps) => {
  if (!isOpen) return null;

  const placementClasses = {
    left: 'inset-y-0 left-0',
    right: 'inset-y-0 right-0',
    top: 'inset-x-0 top-0',
    bottom: 'inset-x-0 bottom-0',
  };

  const sizeClasses = {
    sm: 'w-80',
    md: 'w-96',
    lg: 'w-[400px]',
    xl: 'w-[500px]',
    full: 'w-full',
  };

  const transformClasses = {
    left: '-translate-x-full',
    right: 'translate-x-full',
    top: '-translate-y-full',
    bottom: 'translate-y-full',
  };

  return (
    <div className="fixed inset-0 z-drawer overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Content */}
      <div
        className={cn(
          'fixed bg-white dark:bg-neutral-800 shadow-xl transition-all duration-300 ease-in-out',
          placementClasses[placement],
          sizeClasses[size],
          transformClasses[placement],
          isOpen && 'transform-none'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          {title && (
            <div className="border-b border-neutral-200 dark:border-neutral-700 px-6 py-4">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                {title}
              </h3>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 rounded-md p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            aria-label="Close drawer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

Drawer.displayName = 'Drawer';

export { Drawer };
