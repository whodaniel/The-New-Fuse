import * as TooltipPrimitive from '@radix-ui/react-tooltip';
// import { cva, type VariantProps } from 'class-variance-authority'; // Removed VariantProps
import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils';

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
  (
    {
      children,
      content,
      position = 'top',
      delayDuration = 700,
      disabled = false,
      open,
      onOpenChange,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <TooltipPrimitive.Provider>
        <TooltipPrimitive.Root
          open={open}
          onOpenChange={onOpenChange}
          delayDuration={delayDuration}
          disableHoverableContent={disabled}
        >
          <TooltipPrimitive.Trigger asChild>
            {children}
          </TooltipPrimitive.Trigger>
          <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
              ref={ref}
              side={position}
              className={cn(
                tooltipVariants({ position }),
                className
              )}
              {...props}
            >
              {content}
              <TooltipPrimitive.Arrow className="fill-current text-popover" />
            </TooltipPrimitive.Content>
          </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
      </TooltipPrimitive.Provider>
    );
  }
);

Tooltip.displayName = 'Tooltip';

export { Tooltip };
