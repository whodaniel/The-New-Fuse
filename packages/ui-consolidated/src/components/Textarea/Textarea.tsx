import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils';

/**
 * Textarea variants using class-variance-authority
 */
export const textareaVariants = cva(
  'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: '',
        outline: 'border-2',
        ghost: 'border-none shadow-none bg-transparent',
        filled: 'bg-muted border-transparent',
      },
      state: {
        default: '',
        error: 'border-destructive focus-visible:ring-destructive',
        success: 'border-success focus-visible:ring-success',
      },
      width: {
        default: 'w-full',
        auto: 'w-auto',
        xs: 'w-20',
        sm: 'w-32',
        md: 'w-48',
        lg: 'w-64',
        xl: 'w-96',
      },
    },
    defaultVariants: {
      variant: 'default',
      state: 'default',
      width: 'default',
    },
  }
);

/**
 * Textarea component props
 */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Success message to display
   */
  success?: string;
  /**
   * Label for the textarea
   */
  label?: string;
  /**
   * Helper text to display below the textarea
   */
  helperText?: string;
  /**
   * Class name for the container
   */
  containerClassName?: string;
  /**
   * Class name for the label
   */
  labelClassName?: string;
  /**
   * Class name for the helper text
   */
  helperTextClassName?: string;
  /**
   * Whether to auto-resize the textarea based on content
   */
  autoResize?: boolean;
  /**
   * Maximum height for auto-resize
   */
  maxHeight?: number;
}

/**
 * Textarea component for multi-line text input
 *
 * @example
 * // Basic usage
 * <Textarea placeholder="Enter your message" />
 *
 * // With label and helper text
 * <Textarea 
 *   label="Message" 
 *   placeholder="Enter your message" 
 *   helperText="Maximum 500 characters"
 * />
 *
 * // With error state
 * <Textarea 
 *   label="Bio" 
 *   error="Bio is required"
 * />
 *
 * // With auto-resize
 * <Textarea 
 *   autoResize 
 *   placeholder="This will grow as you type..."
 * />
 *
 * // With variants
 * <Textarea variant="filled" placeholder="Filled textarea" />
 * <Textarea variant="outline" placeholder="Outlined textarea" />
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    className,
    variant,
    state,
    width,
    label,
    helperText,
    error,
    success,
    containerClassName,
    labelClassName,
    helperTextClassName,
    autoResize,
    maxHeight,
    style: _style, // extract style to prevent inline usage, prefix with _ as it's unused
    ...props
  }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
    const combinedRef = React.useMemo(() => {
      return (node: HTMLTextAreaElement) => {
        textareaRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      };
    }, [ref]);

    const inputState = error ? 'error' : success ? 'success' : state;

    // Auto-resize functionality
    const handleAutoResize = React.useCallback(() => {
      if (autoResize && textareaRef.current) {
        // Reset height to auto to get the correct scrollHeight
        textareaRef.current.style.height = 'auto';
        
        // Calculate new height
        const newHeight = Math.min(
          textareaRef.current.scrollHeight,
          maxHeight || Number.MAX_SAFE_INTEGER
        );
        
        // Set the new height
        textareaRef.current.style.height = `${newHeight}px`;
      }
    }, [autoResize, maxHeight]);

    // Handle input changes for auto-resize
    React.useEffect(() => {
      if (autoResize) {
        handleAutoResize();
        
        // Add resize observer to handle content changes
        const resizeObserver = new ResizeObserver(() => {
          handleAutoResize();
        });
        
        if (textareaRef.current) {
          resizeObserver.observe(textareaRef.current);
        }
        
        return () => {
          resizeObserver.disconnect();
        };
      }
    }, [autoResize, handleAutoResize]);

    // Compute dynamic max-height class instead of inline style
    const maxHeightClass = autoResize && maxHeight ? `max-h-[${maxHeight}px]` : '';

    return (
      <div className={cn('space-y-2', containerClassName)}>
        {label && (
          <label
            className={cn(
              'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
              error && 'text-destructive',
              success && 'text-success',
              labelClassName
            )}
          >
            {label}
          </label>
        )}
        <textarea
          ref={combinedRef}
          className={cn(
            textareaVariants({ variant, state: inputState, width }),
            autoResize && 'overflow-hidden resize-none',
            maxHeightClass,
            className
          )}
          onChange={(e) => {
            props.onChange?.(e);
            if (autoResize) {
              handleAutoResize();
            }
          }}
          {...props}
        />
        {(error || success || helperText) && (
          <p
            className={cn(
              'text-sm',
              error && 'text-destructive',
              success && 'text-success',
              !error && !success && 'text-muted-foreground',
              helperTextClassName
            )}
          >
            {error || success || helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
