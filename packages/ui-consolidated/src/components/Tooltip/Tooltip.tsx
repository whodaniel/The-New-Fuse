import * as TooltipPrimitive from '@radix-ui/react-tooltip';
// import { cva, type VariantProps } from 'class-variance-authority'; // Removed VariantProps
import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils.js';

/**
 * Tooltip variants using class-variance-authority
 */
export const tooltipVariants = cva(
  'z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
  {
    variants: {
      position: {
        'top': 'data-[side=top]:slide-in-from-bottom-2',
        'right': 'data-[side=right]:slide-in-from-left-2',
        'bottom': 'data-[side=bottom]:slide-in-from-top-2',
        'left': 'data-[side=left]:slide-in-from-right-2',
      },
    },
    defaultVariants: {
      position: 'top',
    },
  }
);

/**
 * Tooltip component props
 */
export interface TooltipProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'content'> {
  /**
   * Content to display in the tooltip
   */
  content: React.ReactNode;
  /**
   * Delay before showing the tooltip (ms)
   * @default 700
   */
  delay?: number;
  /**
   * Position of the tooltip
   * @default 'top'
   */
  position?: 'top' | 'right' | 'bottom' | 'left';
  /**
   * Whether the tooltip is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Maximum width of the tooltip
   * @default '200px'
   */
  maxWidth?: string;
  /**
   * Whether the tooltip is open
   */
  open?: boolean;
  /**
   * Callback when the tooltip open state changes
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Whether to skip delay on show
   * @default false
   */
  skipDelayDuration?: boolean;
  /**
   * Delay duration in milliseconds
   * @default 700
   */
  delayDuration?: number;
}

/**
 * Tooltip component for displaying additional information on hover
 *
 * @example
 * // Basic usage
 * <Tooltip content="This is a tooltip">
 *   <Button>Hover me</Button>
 * </Tooltip>
 *
 * // With position
 * <Tooltip content="Right tooltip" position="right">
 *   <Button>Hover me</Button>
 * </Tooltip>
 *
 * // With custom delay
 * <Tooltip content="Quick tooltip" delayDuration={200}>
 *   <Button>Hover me</Button>
 * </Tooltip>
 *
 * // With controlled state
 * const [open, setOpen] = useState(false);
 * <Tooltip content="Controlled tooltip" open={open} onOpenChange={setOpen}>
 *   <Button>Hover me</Button>
 * </Tooltip>
 */
const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({
    children,
    content,
    position = 'top',
    delayDuration = 700,
    disabled = false,
    open: controlledOpen,
    onOpenChange,
    skipDelayDuration = false,
    className,
    ...props
  }, ref) => {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
    const [hovering, setHovering] = React.useState(false);
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    
    const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
    const setOpen = React.useCallback((value: boolean) => {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(value);
      }
      onOpenChange?.(value);
    }, [controlledOpen, onOpenChange]);
    
    // Handle mouse enter
    const handleMouseEnter = React.useCallback(() => {
      if (disabled) return;
      
      setHovering(true);
      
      if (skipDelayDuration) {
        setOpen(true);
        return;
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setOpen(true);
      }, delayDuration);
    }, [disabled, skipDelayDuration, delayDuration, setOpen]);
    
    // Handle mouse leave
    const handleMouseLeave = React.useCallback(() => {
      setHovering(false);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      setOpen(false);
    }, [setOpen]);
    
    // Clean up timeout on unmount
    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);
    
    // Handle controlled open state
    React.useEffect(() => {
      if (controlledOpen === undefined) return;
      
      if (controlledOpen && !hovering) {
        setHovering(true);
      } else if (!controlledOpen && hovering) {
        setHovering(false);
      }
    }, [controlledOpen, hovering]);
    
    return (
      <div className="relative inline-block" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {children}
        {open && (
          <div
            ref={ref}
            role="tooltip"
            className={cn(
              tooltipVariants({ position }),
              'absolute',
              position === 'top' && 'bottom-full left-1/2 -translate-x-1/2 mb-2',
              position === 'right' && 'left-full top-1/2 -translate-y-1/2 ml-2',
              position === 'bottom' && 'top-full left-1/2 -translate-x-1/2 mt-2',
              position === 'left' && 'right-full top-1/2 -translate-y-1/2 mr-2',
              className
            )}
            data-state={open ? 'open' : 'closed'}
            data-side={position}
            {...props}
          >
            {content}
          </div>
        )}
      </div>
    );
  }
);

Tooltip.displayName = 'Tooltip';

export { Tooltip };
