import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils.js';

/**
 * Tabs list variants using class-variance-authority
 */
export const tabsListVariants = cva(
  'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
  {
    variants: {
      variant: {
        default: '',
        pills: 'bg-transparent p-0 gap-2',
        underline: 'bg-transparent p-0 border-b border-border',
        bordered: 'border border-border bg-background',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      fullWidth: false,
    },
  }
);

/**
 * Tabs trigger variants using class-variance-authority
 */
export const tabsTriggerVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
  {
    variants: {
      variant: {
        default: 'rounded-sm',
        pills: 'rounded-full border border-transparent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
        underline: 'rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none',
        bordered: 'border-r border-border first:rounded-l-sm last:rounded-r-sm last:border-0 data-[state=active]:bg-muted',
      },
      fullWidth: {
        true: 'flex-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      fullWidth: false,
    },
  }
);

/**
 * Tabs content variants using class-variance-authority
 */
export const tabsContentVariants = cva(
  'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: '',
        pills: '',
        underline: 'pt-4',
        bordered: 'p-4 border border-border rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

/**
 * TabsList component props
 */
export interface TabsListProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tabsListVariants> {}

/**
 * TabsTrigger component props
 */
export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof tabsTriggerVariants> {
  /**
   * Value of the tab
   */
  value: string;
  /**
   * Icon to display in the tab
   */
  icon?: React.ReactNode;
  /**
   * Badge to display in the tab
   */
  badge?: React.ReactNode;
}

/**
 * TabsContent component props
 */
export interface TabsContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tabsContentVariants> {
  /**
   * Value of the tab
   */
  value: string;
}

/**
 * Tabs component props
 */
export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Default value of the tabs
   */
  defaultValue?: string;
  /**
   * Current value of the tabs
   */
  value?: string;
  /**
   * Callback when the value changes
   */
  onValueChange?: (value: string) => void;
  /**
   * Variant of the tabs
   */
  variant?: 'default' | 'pills' | 'underline' | 'bordered';
  /**
   * Whether the tabs should take up the full width
   */
  fullWidth?: boolean;
}

/**
 * Tabs context
 */
type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
  variant: 'default' | 'pills' | 'underline' | 'bordered';
  fullWidth: boolean;
};

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

const useTabs = () => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs component');
  }
  return context;
};

/**
 * Tabs component for switching between different views
 *
 * @example
 * // Basic usage
 * <Tabs defaultValue="tab1">
 *   <TabsList>
 *     <TabsTrigger value="tab1">Tab 1</TabsTrigger>
 *     <TabsTrigger value="tab2">Tab 2</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="tab1">Content for Tab 1</TabsContent>
 *   <TabsContent value="tab2">Content for Tab 2</TabsContent>
 * </Tabs>
 *
 * // With different variants
 * <Tabs variant="pills">
 *   <TabsList>
 *     <TabsTrigger value="tab1">Tab 1</TabsTrigger>
 *     <TabsTrigger value="tab2">Tab 2</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="tab1">Content for Tab 1</TabsContent>
 *   <TabsContent value="tab2">Content for Tab 2</TabsContent>
 * </Tabs>
 *
 * // With icons
 * <Tabs>
 *   <TabsList>
 *     <TabsTrigger value="tab1" icon={<HomeIcon />}>Home</TabsTrigger>
 *     <TabsTrigger value="tab2" icon={<SettingsIcon />}>Settings</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="tab1">Home content</TabsContent>
 *   <TabsContent value="tab2">Settings content</TabsContent>
 * </Tabs>
 *
 * // With badges
 * <Tabs>
 *   <TabsList>
 *     <TabsTrigger value="tab1" badge={<Badge>New</Badge>}>Inbox</TabsTrigger>
 *     <TabsTrigger value="tab2">Archive</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="tab1">Inbox content</TabsContent>
 *   <TabsContent value="tab2">Archive content</TabsContent>
 * </Tabs>
 */
const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({
    defaultValue,
    value,
    onValueChange,
    variant = 'default',
    fullWidth = false,
    className,
    children,
    ...props
  }, ref) => {
    const [tabValue, setTabValue] = React.useState(value || defaultValue || '');
    
    React.useEffect(() => {
      if (value !== undefined) {
        setTabValue(value);
      }
    }, [value]);
    
    const handleValueChange = React.useCallback((newValue: string) => {
      if (value === undefined) {
        setTabValue(newValue);
      }
      onValueChange?.(newValue);
    }, [value, onValueChange]);
    
    return (
      <TabsContext.Provider
        value={{
          value: tabValue,
          onValueChange: handleValueChange,
          variant,
          fullWidth,
        }}
      >
        <div
          ref={ref}
          className={cn('', className)}
          {...props}
        >
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);

Tabs.displayName = 'Tabs';

/**
 * TabsList component for containing tab triggers
 */
const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, ...props }, ref) => {
    const { variant, fullWidth } = useTabs();
    
    return (
      <div
        ref={ref}
        className={cn(tabsListVariants({ variant, fullWidth }), className)}
        role="tablist"
        aria-orientation="horizontal"
        {...props}
      />
    );
  }
);

TabsList.displayName = 'TabsList';

/**
 * TabsTrigger component for triggering tab content
 */
const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, icon, badge, children, ...props }, ref) => {
    const { value: selectedValue, onValueChange, variant, fullWidth } = useTabs();
    const isActive = selectedValue === value;
    
    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        className={cn(tabsTriggerVariants({ variant, fullWidth }), className)}
        onClick={() => onValueChange(value)}
        data-state={isActive ? 'active' : 'inactive'}
        {...props}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {children}
        {badge && <span className="ml-2">{badge}</span>}
      </button>
    );
  }
);

TabsTrigger.displayName = 'TabsTrigger';

/**
 * TabsContent component for displaying tab content
 */
const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: selectedValue, variant } = useTabs();
    const isActive = selectedValue === value;
    
    if (!isActive) return null;
    
    return (
      <div
        ref={ref}
        role="tabpanel"
        className={cn(tabsContentVariants({ variant }), className)}
        data-state={isActive ? 'active' : 'inactive'}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
