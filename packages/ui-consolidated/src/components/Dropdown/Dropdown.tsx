import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils';

/**
 * Dropdown variants using class-variance-authority
 */
export const dropdownVariants = cva(
  'relative inline-block',
  {
    variants: {
      width: {
        auto: 'w-auto',
        full: 'w-full',
      },
    },
    defaultVariants: {
      width: 'auto',
    },
  }
);

/**
 * Dropdown trigger variants using class-variance-authority
 */
export const dropdownTriggerVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

/**
 * Dropdown content variants using class-variance-authority
 */
export const dropdownContentVariants = cva(
  'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
  {
    variants: {
      position: {
        'bottom-start': 'origin-top-left',
        'bottom-end': 'origin-top-right',
        'top-start': 'origin-bottom-left',
        'top-end': 'origin-bottom-right',
      },
      width: {
        auto: 'w-auto',
        trigger: 'w-full',
        sm: 'w-48',
        md: 'w-56',
        lg: 'w-64',
      },
    },
    defaultVariants: {
      position: 'bottom-start',
      width: 'auto',
    },
  }
);

/**
 * Dropdown item variants using class-variance-authority
 */
export const dropdownItemVariants = cva(
  'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  {
    variants: {
      variant: {
        default: '',
        destructive: 'text-destructive focus:bg-destructive focus:text-destructive-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

/**
 * Dropdown component props
 */
export interface DropdownProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dropdownVariants> {
  /**
   * Whether the dropdown is open
   */
  open?: boolean;
  /**
   * Callback when the dropdown open state changes
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Default open state
   */
  defaultOpen?: boolean;
}

/**
 * Dropdown trigger component props
 */
export interface DropdownTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof dropdownTriggerVariants> {
  /**
   * Whether to show a dropdown icon
   * @default true
   */
  showIcon?: boolean;
  /**
   * Custom dropdown icon
   */
  icon?: React.ReactNode;
}

/**
 * Dropdown content component props
 */
export interface DropdownContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dropdownContentVariants> {
  /**
   * Whether to close the dropdown when clicking outside
   * @default true
   */
  closeOnClickOutside?: boolean;
  /**
   * Whether to close the dropdown when pressing escape
   * @default true
   */
  closeOnEscape?: boolean;
}

/**
 * Dropdown item component props
 */
export interface DropdownItemProps
  extends React.LiHTMLAttributes<HTMLLIElement>,
    VariantProps<typeof dropdownItemVariants> {
  /**
   * Whether the item is disabled
   */
  disabled?: boolean;
  /**
   * Icon to display before the item text
   */
  icon?: React.ReactNode;
  /**
   * Whether to close the dropdown when clicking the item
   * @default true
   */
  closeOnClick?: boolean;
}

/**
 * Dropdown separator component props
 */
export interface DropdownSeparatorProps extends React.HTMLAttributes<HTMLLIElement> {} // Changed HTMLDivElement to HTMLLIElement

/**
 * Dropdown label component props
 */
export interface DropdownLabelProps extends React.HTMLAttributes<HTMLLIElement> {} // Changed HTMLDivElement to HTMLLIElement

/**
 * Dropdown context
 */
type DropdownContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DropdownContext = React.createContext<DropdownContextValue | undefined>(undefined);

const useDropdown = () => {
  const context = React.useContext(DropdownContext);
  if (!context) {
    throw new Error('Dropdown components must be used within a Dropdown component');
  }
  return context;
};

/**
 * Dropdown component for displaying a dropdown menu
 *
 * @example
 * // Basic usage
 * <Dropdown>
 *   <DropdownTrigger>Open</DropdownTrigger>
 *   <DropdownContent>
 *     <DropdownItem>Item 1</DropdownItem>
 *     <DropdownItem>Item 2</DropdownItem>
 *     <DropdownItem>Item 3</DropdownItem>
 *   </DropdownContent>
 * </Dropdown>
 *
 * // With controlled state
 * const [open, setOpen] = useState(false);
 * <Dropdown open={open} onOpenChange={setOpen}>
 *   <DropdownTrigger>Open</DropdownTrigger>
 *   <DropdownContent>
 *     <DropdownItem>Item 1</DropdownItem>
 *     <DropdownItem>Item 2</DropdownItem>
 *     <DropdownItem>Item 3</DropdownItem>
 *   </DropdownContent>
 * </Dropdown>
 *
 * // With custom trigger
 * <Dropdown>
 *   <DropdownTrigger variant="outline" size="sm">
 *     Options
 *   </DropdownTrigger>
 *   <DropdownContent>
 *     <DropdownItem>Item 1</DropdownItem>
 *     <DropdownItem>Item 2</DropdownItem>
 *     <DropdownItem>Item 3</DropdownItem>
 *   </DropdownContent>
 * </Dropdown>
 */
const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
  ({
    className,
    width,
    open,
    onOpenChange,
    defaultOpen = false,
    children,
    ...props
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);
    
    const openState = open !== undefined ? open : isOpen;
    const setOpenState = React.useCallback((value: boolean) => {
      if (open === undefined) {
        setIsOpen(value);
      }
      onOpenChange?.(value);
    }, [open, onOpenChange]);
    
    return (
      <DropdownContext.Provider
        value={{
          open: openState,
          setOpen: setOpenState,
        }}
      >
        <div
          ref={ref}
          className={cn(dropdownVariants({ width }), className)}
          {...props}
        >
          {children}
        </div>
      </DropdownContext.Provider>
    );
  }
);

Dropdown.displayName = 'Dropdown';

/**
 * Dropdown trigger component for opening the dropdown
 */
const DropdownTrigger = React.forwardRef<HTMLButtonElement, DropdownTriggerProps>(
  ({
    className,
    variant,
    size,
    showIcon = true,
    icon,
    children,
    ...props
  }, ref) => {
    const { open, setOpen } = useDropdown();
    
    return (
      <button
        ref={ref}
        type="button"
        className={cn(dropdownTriggerVariants({ variant, size }), className)}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        {...props}
      >
        {children}
        {showIcon && (
          <span className="ml-2">
            {icon || (
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
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  open && "transform rotate-180"
                )}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            )}
          </span>
        )}
      </button>
    );
  }
);

DropdownTrigger.displayName = 'DropdownTrigger';

/**
 * Helper function to merge multiple refs.
 */
function useMergeRefs<T>(...refs: (React.Ref<T> | undefined)[]): React.RefCallback<T> {
  return React.useCallback((value: T | null) => {
    refs.forEach(ref => {
      if (typeof ref === 'function') {
        ref(value);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  }, refs); // eslint-disable-line react-hooks/exhaustive-deps
}


/**
 * Dropdown content component for displaying the dropdown menu
 */
const DropdownContent = React.forwardRef<HTMLDivElement, DropdownContentProps>(
  ({
    className,
    position,
    width,
    closeOnClickOutside = true,
    closeOnEscape = true,
    children,
    style, // Added style prop
    ...props
  }, forwardedRef) => { // Renamed ref to forwardedRef
    const { open, setOpen } = useDropdown();
    const contentRef = React.useRef<HTMLDivElement>(null);
    const mergedRef = useMergeRefs(forwardedRef, contentRef); // Merge refs

    // Effect to handle closing on outside click
    React.useEffect(() => {
      if (!open || !closeOnClickOutside) return;

      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        // Check if the click is outside the content and not on the trigger (assuming trigger has aria-controls)
        const trigger = document.querySelector(`[aria-controls="${contentRef.current?.id}"]`);
        if (contentRef.current && !contentRef.current.contains(target) && (!trigger || !trigger.contains(target))) {
          setOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open, setOpen, closeOnClickOutside]);

    // Effect to handle closing on escape key press
    React.useEffect(() => {
      if (!open || !closeOnEscape) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setOpen(false);
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, setOpen, closeOnEscape]);

    // Calculate position based on trigger element (example logic, might need adjustment)
    const [dynamicStyle, setDynamicStyle] = React.useState<React.CSSProperties>({});
    React.useEffect(() => {
        if (open && contentRef.current) {
            const trigger = document.querySelector(`[aria-controls="${contentRef.current.id}"]`);
            if (trigger) {
                const triggerRect = trigger.getBoundingClientRect();
                const contentRect = contentRef.current.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const viewportWidth = window.innerWidth;

                let top = triggerRect.bottom + window.scrollY;
                let left = triggerRect.left + window.scrollX;

                if (position?.includes('top')) {
                    top = triggerRect.top + window.scrollY - contentRect.height;
                }
                if (position?.includes('end')) {
                    left = triggerRect.right + window.scrollX - contentRect.width;
                }

                // Adjust if overflowing viewport
                if (top + contentRect.height > viewportHeight + window.scrollY) {
                    top = triggerRect.top + window.scrollY - contentRect.height; // Flip to top
                }
                if (left + contentRect.width > viewportWidth + window.scrollX) {
                    left = triggerRect.right + window.scrollX - contentRect.width; // Align right
                }
                if (top < window.scrollY) {
                    top = triggerRect.bottom + window.scrollY; // Flip back to bottom if still overflowing top
                }
                 if (left < window.scrollX) {
                    left = triggerRect.left + window.scrollX; // Align left
                }


                setDynamicStyle({
                    position: 'absolute',
                    top: `${top}px`,
                    left: `${left}px`,
                    width: width === 'trigger' ? `${triggerRect.width}px` : undefined,
                });
            } else {
                 // Fallback if trigger not found (e.g., position relative to parent)
                 setDynamicStyle({
                    position: 'absolute',
                    top: '100%', // Default bottom-start like
                    left: 0,
                    width: width === 'trigger' ? '100%' : undefined,
                 });
            }
        }
    }, [open, position, width, contentRef.current?.id]); // Added dependency


    if (!open) return null;

    return (
      // Use Portal if available/needed, e.g., from Radix UI or Headless UI
      // <Portal>
        <div
          ref={mergedRef} // Use merged ref
          className={cn(
            'absolute', // Use absolute positioning
            dropdownContentVariants({ position: position || 'bottom-start', width: width || 'auto' }), // Apply variants, but position might be overridden by style
            className
          )}
          style={{ ...dynamicStyle, ...style }} // Combine dynamic and passed styles
          role="menu"
          aria-orientation="vertical"
          // Generate an ID if not provided, link with trigger via aria-controls
          id={props.id || `dropdown-content-${React.useId()}`}
          {...props}
        >
          <ul className="list-none p-0 m-0">{children}</ul> {/* Wrap items in ul */}
        </div>
      // </Portal>
    );
  }
);

DropdownContent.displayName = 'DropdownContent';

/**
 * Dropdown item component for displaying a dropdown menu item
 */
const DropdownItem = React.forwardRef<HTMLLIElement, DropdownItemProps>( // Changed HTMLDivElement to HTMLLIElement
  ({ className, variant, disabled, icon, closeOnClick = true, children, ...props }, ref) => {
    const { setOpen } = useDropdown(); // Removed unused 'open'

    // Use a local ref to the li element
    const itemRef = React.useRef<HTMLLIElement | null>(null); // Changed HTMLDivElement to HTMLLIElement

    // Use imperative handle to expose the local ref through the forwarded ref
    React.useImperativeHandle(ref, () => itemRef.current as HTMLLIElement); // Changed HTMLDivElement to HTMLLIElement

    // Handle click with type safety
    const handleClick = React.useCallback((e: React.MouseEvent<HTMLLIElement>) => { // Changed HTMLDivElement to HTMLLIElement
      if (disabled) return;

      if (closeOnClick) {
        setOpen(false);
      }

      if (props.onClick) {
        // Cast safely to avoid type errors
        const originalOnClick = props.onClick as unknown as React.MouseEventHandler<HTMLLIElement>; // Changed HTMLDivElement to HTMLLIElement
        originalOnClick(e);
      }
    }, [closeOnClick, disabled, props.onClick, setOpen]);

    // Remove incompatible properties from the props if necessary, though changing to li might resolve this
    const liProps = { ...props } as React.LiHTMLAttributes<HTMLLIElement>; // Changed divProps to liProps and type

    return (
      <li // Changed div to li
        ref={itemRef}
        className={cn(
          dropdownItemVariants({ variant }),
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        onClick={handleClick}
        // role="menuitem" // Removed role
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        data-disabled={disabled || undefined}
        {...liProps} // Use liProps
      >
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </li> // Changed div to li
    );
  }
);

DropdownItem.displayName = 'DropdownItem';

/**
 * Dropdown separator component for separating dropdown menu items
 */
const DropdownSeparator = React.forwardRef<HTMLLIElement, DropdownSeparatorProps>( // Changed HTMLDivElement to HTMLLIElement
  ({ className, ...props }, ref) => (
    <li // Changed div to li
      ref={ref}
      className={cn('-mx-1 my-1 h-px bg-muted', className)}
      // role="separator" // Removed role
      aria-orientation="horizontal"
      {...props}
    />
  )
);

DropdownSeparator.displayName = 'DropdownSeparator';

/**
 * Dropdown label component for labeling dropdown menu sections
 */
const DropdownLabel = React.forwardRef<HTMLLIElement, DropdownLabelProps>( // Changed HTMLDivElement to HTMLLIElement
  ({ className, children, ...props }, ref) => (
    <li // Changed div to li
      ref={ref}
      className={cn('px-2 py-1.5 text-sm font-semibold text-muted-foreground list-none', className)} // Added list-none
      // Removed role="group" or similar as it's now an li, semantics handled by structure
      {...props}
    >
      {children}
    </li> // Changed div to li
  )
);

DropdownLabel.displayName = 'DropdownLabel';

export {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
};
