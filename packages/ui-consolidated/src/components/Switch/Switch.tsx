import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils';

/**
 * Switch variants using class-variance-authority
 */
export const switchVariants = cva(
  'peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
  {
    variants: {
      size: {
        default: 'h-[24px] w-[44px]',
        sm: 'h-[20px] w-[36px]',
        lg: 'h-[28px] w-[52px]',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

/**
 * Switch thumb variants using class-variance-authority
 */
export const switchThumbVariants = cva(
  'pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
  {
    variants: {
      size: {
        default: 'h-5 w-5',
        sm: 'h-4 w-4 data-[state=checked]:translate-x-4',
        lg: 'h-6 w-6 data-[state=checked]:translate-x-6',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

/**
 * Switch component props
 */
export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof switchVariants> {
  /**
   * Label for the switch
   */
  label?: string;
  /**
   * Helper text to display below the switch
   */
  helperText?: string;
  /**
   * Error message to display
   */
  error?: string;
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
   * Position of the label
   */
  labelPosition?: 'left' | 'right';
}

/**
 * Switch component for toggling between two states
 *
 * @example
 * // Basic usage
 * <Switch />
 *
 * // With label
 * <Switch label="Enable notifications" />
 *
 * // With helper text
 * <Switch 
 *   label="Dark mode" 
 *   helperText="Switch between light and dark theme"
 * />
 *
 * // With error
 * <Switch 
 *   label="Required toggle" 
 *   error="This setting must be enabled"
 * />
 *
 * // With different size
 * <Switch size="lg" label="Large switch" />
 *
 * // With label on the left
 * <Switch labelPosition="left" label="Label on left" />
 */
const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({
    className,
    size,
    label,
    helperText,
    error,
    containerClassName,
    labelClassName,
    helperTextClassName,
    labelPosition = 'right',
    ...props
  }, ref) => {
    const id = React.useId();
    const [checked, setChecked] = React.useState(props.defaultChecked || props.checked || false);
    
    React.useEffect(() => {
      if (props.checked !== undefined) {
        setChecked(props.checked);
      }
    }, [props.checked]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (props.checked === undefined) {
        setChecked(e.target.checked);
      }
      props.onChange?.(e);
    };
    
    return (
      <div className={cn('flex flex-col space-y-2', containerClassName)}>
        <div className={cn(
          'flex items-center',
          labelPosition === 'left' ? 'flex-row-reverse justify-end space-x-reverse space-x-2' : 'space-x-2'
        )}>
          <div className="relative">
            <input
              type="checkbox"
              id={id}
              ref={ref}
              className="sr-only"
              checked={checked}
              aria-checked={checked}
              aria-invalid={!!error}
              tabIndex={0}
              {...props}
              onChange={handleChange}
            />
            <div
              className={cn(
                switchVariants({ size }),
                className
              )}
              data-state={checked ? 'checked' : 'unchecked'}
            >
              <div
                className={cn(
                  switchThumbVariants({ size })
                )}
                data-state={checked ? 'checked' : 'unchecked'}
              />
            </div>
          </div>
          {label && (
            <label
              htmlFor={id}
              className={cn(
                'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                error && 'text-destructive',
                labelClassName
              )}
            >
              {label}
            </label>
          )}
        </div>
        {(error || helperText) && (
          <p
            className={cn(
              'text-sm',
              error ? 'text-destructive' : 'text-muted-foreground',
              helperTextClassName
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';

export { Switch };
