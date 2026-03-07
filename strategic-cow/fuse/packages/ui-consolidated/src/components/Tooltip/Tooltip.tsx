import React, { useState, forwardRef } from 'react';

export interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  ({ children, content, side = 'top', className = '' }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    
    // Position classes based on side
    const positionClasses = {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      right: 'left-full top-1/2 -translate-y-1/2 ml-2',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    };
    
    return (
      <div className="relative inline-flex" ref={ref}>
        <div
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
          onFocus={() => setIsVisible(true)}
          onBlur={() => setIsVisible(false)}
        >
          {children}
        </div>
        
        {isVisible && (
          <div 
            className={`absolute z-50 px-3 py-2 text-sm text-white bg-black rounded-md ${positionClasses[side]} ${className}`}
            role="tooltip"
          >
            {content}
          </div>
        )}
      </div>
    );
  }
);

Tooltip.displayName = 'Tooltip';