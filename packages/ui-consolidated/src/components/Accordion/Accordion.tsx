import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils.js';

/**
 * Accordion variants using class-variance-authority
 */
export const accordionVariants = cva(
  'w-full',
  {
    variants: {
      variant: {
        default: 'border rounded-md',
        bordered: 'border rounded-md divide-y',
        ghost: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

/**
 * Accordion item variants using class-variance-authority
 */
export const accordionItemVariants = cva(
  '',
  {
    variants: {
      variant: {
        default: 'border-b last:border-0',
        bordered: '',
        ghost: 'border-b last:border-0',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

/**
 * Accordion trigger variants using class-variance-authority
 */
export const accordionTriggerVariants = cva(
  'flex w-full items-center justify-between py-4 text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180',
  {
    variants: {
      variant: {
        default: 'px-4',
        bordered: 'px-4',
        ghost: 'px-0',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

/**
 * Accordion content variants using class-variance-authority
 */
export const accordionContentVariants = cva(
  'overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
  {
    variants: {
      variant: {
        default: 'px-4',
        bordered: 'px-4',
        ghost: 'px-0',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

/**
 * Accordion component props
 */
export interface AccordionProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof accordionVariants> {
  /**
   * Type of accordion
   * @default 'single'
   */
  type?: 'single' | 'multiple';
  /**
   * Default value(s) for the accordion
   */
  defaultValue?: string | string[];
  /**
   * Current value(s) for the accordion
   */
  value?: string | string[];
  /**
   * Callback when the value changes
   */
  onValueChange?: (value: string | string[]) => void;
  /**
   * Whether the accordion is collapsible
   * @default true
   */
  collapsible?: boolean;
}

/**
 * Accordion item component props
 */
export interface AccordionItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof accordionItemVariants> {
  /**
   * Value of the accordion item
   */
  value: string;
  /**
   * Whether the accordion item is disabled
   * @default false
   */
  disabled?: boolean;
}

/**
 * Accordion trigger component props
 */
export interface AccordionTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof accordionTriggerVariants> {
  /**
   * Whether to show the chevron icon
   * @default true
   */
  showChevron?: boolean;
  /**
   * Custom chevron icon
   */
  chevron?: React.ReactNode;
}

/**
 * Accordion content component props
 */
export interface AccordionContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof accordionContentVariants> {}

/**
 * Accordion context
 */
type AccordionContextValue = {
  value: string | string[];
  onValueChange: (value: string | string[]) => void;
  type: 'single' | 'multiple';
  collapsible: boolean;
  variant: 'default' | 'bordered' | 'ghost';
};

const AccordionContext = React.createContext<AccordionContextValue | undefined>(undefined);

const useAccordion = () => {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion components must be used within an Accordion component');
  }
  return context;
};

/**
 * Accordion item context
 */
type AccordionItemContextValue = {
  value: string;
  isOpen: boolean;
  isDisabled: boolean;
  toggle: () => void;
};

const AccordionItemContext = React.createContext<AccordionItemContextValue | undefined>(undefined);

const useAccordionItem = () => {
  const context = React.useContext(AccordionItemContext);
  if (!context) {
    throw new Error('AccordionTrigger/AccordionContent must be used within an AccordionItem');
  }
  return context;
};

/**
 * Accordion component for displaying collapsible content
 *
 * @example
 * // Basic usage
 * <Accordion type="single" defaultValue="item-1" collapsible>
 *   <AccordionItem value="item-1">
 *     <AccordionTrigger>Item 1</AccordionTrigger>
 *     <AccordionContent>Content for item 1</AccordionContent>
 *   </AccordionItem>
 *   <AccordionItem value="item-2">
 *     <AccordionTrigger>Item 2</AccordionTrigger>
 *     <AccordionContent>Content for item 2</AccordionContent>
 *   </AccordionItem>
 * </Accordion>
 *
 * // Multiple items can be open
 * <Accordion type="multiple" defaultValue={["item-1", "item-2"]}>
 *   <AccordionItem value="item-1">
 *     <AccordionTrigger>Item 1</AccordionTrigger>
 *     <AccordionContent>Content for item 1</AccordionContent>
 *   </AccordionItem>
 *   <AccordionItem value="item-2">
 *     <AccordionTrigger>Item 2</AccordionTrigger>
 *     <AccordionContent>Content for item 2</AccordionContent>
 *   </AccordionItem>
 * </Accordion>
 *
 * // With different variants
 * <Accordion variant="bordered">
 *   <AccordionItem value="item-1">
 *     <AccordionTrigger>Item 1</AccordionTrigger>
 *     <AccordionContent>Content for item 1</AccordionContent>
 *   </AccordionItem>
 * </Accordion>
 */
const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({
    className,
    variant,
    type = 'single',
    defaultValue,
    value,
    onValueChange,
    collapsible = true,
    children,
    ...props
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState<string | string[]>(
      defaultValue || (type === 'multiple' ? [] : '')
    );
    
    const currentValue = value !== undefined ? value : internalValue;
    
    const handleValueChange = React.useCallback((newValue: string | string[]) => {
      if (value === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    }, [value, onValueChange]);
    
    return (
      <AccordionContext.Provider
        value={{
          value: currentValue,
          onValueChange: handleValueChange,
          type,
          collapsible,
          variant: variant || 'default',
        }}
      >
        <div
          ref={ref}
          className={cn(accordionVariants({ variant }), className)}
          {...props}
        >
          {children}
        </div>
      </AccordionContext.Provider>
    );
  }
);

Accordion.displayName = 'Accordion';

/**
 * Accordion item component for containing accordion content
 */
const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({
    className,
    variant,
    value,
    disabled = false,
    children,
    ...props
  }, ref) => {
    const { value: accordionValue, onValueChange, type, collapsible, variant: accordionVariant } = useAccordion();
    
    const isOpen = type === 'single'
      ? accordionValue === value
      : Array.isArray(accordionValue) && accordionValue.includes(value);
    
    const toggle = React.useCallback(() => {
      if (disabled) return;
      
      if (type === 'single') {
        if (collapsible && accordionValue === value) {
          onValueChange('');
        } else {
          onValueChange(value);
        }
      } else {
        if (Array.isArray(accordionValue)) {
          if (accordionValue.includes(value)) {
            onValueChange(accordionValue.filter((v) => v !== value));
          } else {
            onValueChange([...accordionValue, value]);
          }
        }
      }
    }, [accordionValue, collapsible, disabled, onValueChange, type, value]);
    
    return (
      <AccordionItemContext.Provider
        value={{
          value,
          isOpen,
          isDisabled: disabled,
          toggle,
        }}
      >
        <div
          ref={ref}
          className={cn(
            accordionItemVariants({ variant: variant || accordionVariant }),
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          data-state={isOpen ? 'open' : 'closed'}
          data-disabled={disabled || undefined}
          {...props}
        >
          {children}
        </div>
      </AccordionItemContext.Provider>
    );
  }
);

AccordionItem.displayName = 'AccordionItem';

/**
 * Accordion trigger component for toggling accordion content
 */
const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({
    className,
    variant,
    showChevron = true,
    chevron,
    children,
    ...props
  }, ref) => {
    const { isOpen, isDisabled, toggle } = useAccordionItem();
    const { variant: accordionVariant } = useAccordion();
    
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          accordionTriggerVariants({ variant: variant || accordionVariant }),
          className
        )}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        }}
        disabled={isDisabled}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${String(props.id || '')}`}
        data-state={isOpen ? 'open' : 'closed'}
        {...props}
      >
        {children}
        {showChevron && (
          <div className="shrink-0 transition-transform duration-200">
            {chevron || (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 transition-transform duration-200"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            )}
          </div>
        )}
      </button>
    );
  }
);

AccordionTrigger.displayName = 'AccordionTrigger';

/**
 * Accordion content component for displaying accordion content
 */
const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({
    className,
    variant,
    children,
    ...props
  }, ref) => {
    const { isOpen } = useAccordionItem();
    const { variant: accordionVariant } = useAccordion();
    
    if (!isOpen) return null;
    
    return (
      <div
        ref={ref}
        className={cn(
          accordionContentVariants({ variant: variant || accordionVariant }),
          className
        )}
        data-state={isOpen ? 'open' : 'closed'}
        {...props}
      >
        <div className="pb-4 pt-0">{children}</div>
      </div>
    );
  }
);

AccordionContent.displayName = 'AccordionContent';

export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
};
