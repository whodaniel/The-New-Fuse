import React, { createContext, useContext, useState } from 'react';

interface SelectContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextValue | undefined>(undefined);

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

const Select = ({ value, onValueChange, children, className = '' }: SelectProps) => {
  const [open, setOpen] = useState(false);
  
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className={`relative ${className}`}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className = '', children, ...props }, ref) => {
    const context = useContext(SelectContext);
    if (!context) throw new Error('SelectTrigger must be used within Select');
    
    return (
      <button
        ref={ref}
        type="button"
        className={`
          flex h-10 w-full items-center justify-between rounded-md border border-gray-300 
          bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
          disabled:cursor-not-allowed disabled:opacity-50
          ${className}
        `}
        onClick={() => context.setOpen(!context.open)}
        {...props}
      >
        {children}
        <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  }
);

SelectTrigger.displayName = 'SelectTrigger';

interface SelectContentProps {
  className?: string;
  children: React.ReactNode;
}

const SelectContent = ({ className = '', children }: SelectContentProps) => {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectContent must be used within Select');
  
  if (!context.open) return null;
  
  return (
    <div className={`
      absolute top-full left-0 z-50 mt-1 min-w-full overflow-hidden rounded-md border 
      border-gray-200 bg-white text-gray-950 shadow-md
      ${className}
    `}>
      <div className="p-1">
        {children}
      </div>
    </div>
  );
};

interface SelectItemProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

const SelectItem = ({ value, className = '', children }: SelectItemProps) => {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectItem must be used within Select');
  
  return (
    <div
      className={`
        relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 
        text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 data-[disabled]:pointer-events-none 
        data-[disabled]:opacity-50
        ${className}
      `}
      onClick={() => {
        context.onValueChange?.(value);
        context.setOpen(false);
      }}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {context.value === value && (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      {children}
    </div>
  );
};

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

const SelectValue = ({ placeholder, className = '' }: SelectValueProps) => {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectValue must be used within Select');
  
  return (
    <span className={className}>
      {context.value || placeholder}
    </span>
  );
};

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue };
