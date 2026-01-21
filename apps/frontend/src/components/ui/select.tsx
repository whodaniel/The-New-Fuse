import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

// Simple select component that matches the API used in the pages
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  value?: string;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', onChange, onValueChange, children, ...props }, ref) => {
    // Handle both onChange and onValueChange patterns
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      onChange?.(value);
      onValueChange?.(value);
    };

    // Check if children contain option elements (simple pattern) or components (advanced pattern)
    const hasOptionChildren = React.Children.toArray(children).some(
      (child) => React.isValidElement(child) && child.type === 'option'
    );

    if (hasOptionChildren) {
      // Simple select with option children
      return (
        <select
          className={cn(
            "flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm",
            "ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          onChange={handleChange}
          ref={ref}
          {...props}
        >
          {children}
        </select>
      );
    } else {
      // Advanced select - wrap in SelectRoot context
      return (
        <SelectRoot value={props.value} onValueChange={onValueChange || onChange}>
          {children}
        </SelectRoot>
      );
    }
  }
);

Select.displayName = 'Select';

// Advanced Select components for shadcn/ui compatibility
interface SelectContextType {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined);

interface SelectRootProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  defaultValue?: string;
}

const SelectRoot: React.FC<SelectRootProps> = ({
  value,
  onValueChange,
  children,
  defaultValue,
}) => {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue || value || '');

  const currentValue = value !== undefined ? value : internalValue;

  const handleValueChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
    setOpen(false);
  };

  return (
    <SelectContext.Provider
      value={{ value: currentValue, onValueChange: handleValueChange, open, setOpen }}
    >
      {children}
    </SelectContext.Provider>
  );
};

interface SelectTriggerProps {
  className?: string;
  children: React.ReactNode;
}

const SelectTrigger: React.FC<SelectTriggerProps> = ({ className = '', children }) => {
  const context = React.useContext(SelectContext);
  const ref = useRef<HTMLButtonElement>(null);

  if (!context) {
    throw new Error('SelectTrigger must be used within a Select');
  }

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm",
        "ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={() => context.setOpen(!context.open)}
    >
      {children}
      <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
};

interface SelectValueProps {
  placeholder?: string;
}

const SelectValue: React.FC<SelectValueProps> = ({ placeholder = 'Select...' }) => {
  const context = React.useContext(SelectContext);

  if (!context) {
    throw new Error('SelectValue must be used within a Select');
  }

  return <span>{context.value || placeholder}</span>;
};

interface SelectContentProps {
  className?: string;
  children: React.ReactNode;
}

const SelectContent: React.FC<SelectContentProps> = ({ className = '', children }) => {
  const context = React.useContext(SelectContext);
  const ref = useRef<HTMLDivElement>(null);

  if (!context) {
    throw new Error('SelectContent must be used within a Select');
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        context.setOpen(false);
      }
    };

    if (context.open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [context.open, context]);

  if (!context.open) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-background p-1 text-foreground shadow-lg",
        "animate-in fade-in-0 zoom-in-95",
        className
      )}
    >
      {children}
    </div>
  );
};

interface SelectItemProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

const SelectItem: React.FC<SelectItemProps> = ({ value, className = '', children }) => {
  const context = React.useContext(SelectContext);

  if (!context) {
    throw new Error('SelectItem must be used within a Select');
  }

  const isSelected = context.value === value;

  return (
    <div
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
        "focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        isSelected && "bg-accent text-accent-foreground",
        className
      )}
      onClick={() => context.onValueChange?.(value)}
    >
      {isSelected && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
      {children}
    </div>
  );
};

// SelectGroup for grouping select items
interface SelectGroupProps {
  children: React.ReactNode;
}

const SelectGroup: React.FC<SelectGroupProps> = ({ children }) => {
  return <div role="group">{children}</div>;
};

// SelectLabel for group labels
interface SelectLabelProps {
  className?: string;
  children: React.ReactNode;
}

const SelectLabel: React.FC<SelectLabelProps> = ({ className = '', children }) => {
  return (
    <div
      className={cn(
        "py-1.5 pl-8 pr-2 text-sm font-semibold text-foreground",
        className
      )}
    >
      {children}
    </div>
  );
};

// Export both simple and advanced versions
export {
  Select,
  SelectRoot as SelectContainer,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
};

// Default export for backwards compatibility
export default Select;
