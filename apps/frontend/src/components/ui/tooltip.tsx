// @ts-nocheck
/**
 * Tooltip Component - Chakra-compatible Tooltip for The New Fuse
 */

import { cn } from '@/lib/utils';
import { useEffect, useRef, useState, type ReactNode } from 'react';

interface TooltipProps {
  label: string;
  children: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  hasArrow?: boolean;
  isDisabled?: boolean;
  className?: string;
}

export const Tooltip = ({
  label,
  children,
  placement = 'top',
  hasArrow = true,
  isDisabled = false,
  className,
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let top = 0;
      let left = 0;

      switch (placement) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - 8;
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = triggerRect.bottom + 8;
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.left - tooltipRect.width - 8;
          break;
        case 'right':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.right + 8;
          break;
      }

      setPosition({ top, left });
    }
  }, [isVisible, placement]);

  if (isDisabled) {
    return <>{children}</>;
  }

  const arrowClasses: Record<'top' | 'bottom' | 'left' | 'right', string> = {
    top: 'bottom-[-4px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent',
    bottom:
      'top-[-4px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent',
    left: 'right-[-4px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent',
    right:
      'left-[-4px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent',
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-block"
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            'fixed z-[1060] px-3 py-2 text-sm text-white bg-gray-900 dark:bg-gray-700 rounded-md shadow-none',
            'animate-in fade-in-0 zoom-in-95 duration-200',
            className
          )}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {label}
          {hasArrow && (
            <div
              className={cn(
                'absolute w-0 h-0 border-4 border-gray-900 dark:border-gray-700',
                arrowClasses[placement]
              )}
            />
          )}
        </div>
      )}
    </>
  );
};
