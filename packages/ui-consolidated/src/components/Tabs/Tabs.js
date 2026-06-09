import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils';
/**
 * Tabs list variants using class-variance-authority
 */
export const tabsListVariants = cva('inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground', {
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
});
/**
 * Tabs trigger variants using class-variance-authority
 */
export const tabsTriggerVariants = cva('inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm', {
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
});
/**
 * Tabs content variants using class-variance-authority
 */
export const tabsContentVariants = cva('mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', {
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
});
const TabsContext = React.createContext(undefined);
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
const Tabs = React.forwardRef(({ defaultValue, value, onValueChange, variant = 'default', fullWidth = false, className, children, ...props }, ref) => {
    const [tabValue, setTabValue] = React.useState(value || defaultValue || '');
    React.useEffect(() => {
        if (value !== undefined) {
            setTabValue(value);
        }
    }, [value]);
    const handleValueChange = React.useCallback((newValue) => {
        if (value === undefined) {
            setTabValue(newValue);
        }
        onValueChange?.(newValue);
    }, [value, onValueChange]);
    return (_jsx(TabsContext.Provider, { value: {
            value: tabValue,
            onValueChange: handleValueChange,
            variant,
            fullWidth,
        }, children: _jsx("div", { ref: ref, className: cn('', className), ...props, children: children }) }));
});
Tabs.displayName = 'Tabs';
/**
 * TabsList component for containing tab triggers
 */
const TabsList = React.forwardRef(({ className, ...props }, ref) => {
    const { variant, fullWidth } = useTabs();
    return (_jsx("div", { ref: ref, className: cn(tabsListVariants({ variant, fullWidth }), className), role: "tablist", "aria-orientation": "horizontal", ...props }));
});
TabsList.displayName = 'TabsList';
/**
 * TabsTrigger component for triggering tab content
 */
const TabsTrigger = React.forwardRef(({ className, value, icon, badge, children, ...props }, ref) => {
    const { value: selectedValue, onValueChange, variant, fullWidth } = useTabs();
    const isActive = selectedValue === value;
    return (_jsxs("button", { ref: ref, type: "button", role: "tab", "aria-selected": isActive, className: cn(tabsTriggerVariants({ variant, fullWidth }), className), onClick: () => onValueChange(value), "data-state": isActive ? 'active' : 'inactive', ...props, children: [icon && _jsx("span", { className: "mr-2", children: icon }), children, badge && _jsx("span", { className: "ml-2", children: badge })] }));
});
TabsTrigger.displayName = 'TabsTrigger';
/**
 * TabsContent component for displaying tab content
 */
const TabsContent = React.forwardRef(({ className, value, children, ...props }, ref) => {
    const { value: selectedValue, variant } = useTabs();
    const isActive = selectedValue === value;
    if (!isActive)
        return null;
    return (_jsx("div", { ref: ref, role: "tabpanel", className: cn(tabsContentVariants({ variant }), className), "data-state": isActive ? 'active' : 'inactive', ...props, children: children }));
});
TabsContent.displayName = 'TabsContent';
export { Tabs, TabsList, TabsTrigger, TabsContent };
