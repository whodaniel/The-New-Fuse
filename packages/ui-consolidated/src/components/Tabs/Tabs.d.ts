import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
/**
 * Tabs list variants using class-variance-authority
 */
export declare const tabsListVariants: (props?: ({
    variant?: "default" | "bordered" | "underline" | "pills" | null | undefined;
    fullWidth?: boolean | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Tabs trigger variants using class-variance-authority
 */
export declare const tabsTriggerVariants: (props?: ({
    variant?: "default" | "bordered" | "underline" | "pills" | null | undefined;
    fullWidth?: boolean | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Tabs content variants using class-variance-authority
 */
export declare const tabsContentVariants: (props?: ({
    variant?: "default" | "bordered" | "underline" | "pills" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * TabsList component props
 */
export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof tabsListVariants> {
}
/**
 * TabsTrigger component props
 */
export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof tabsTriggerVariants> {
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
export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof tabsContentVariants> {
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
declare const Tabs: React.ForwardRefExoticComponent<TabsProps & React.RefAttributes<HTMLDivElement>>;
/**
 * TabsList component for containing tab triggers
 */
declare const TabsList: React.ForwardRefExoticComponent<TabsListProps & React.RefAttributes<HTMLDivElement>>;
/**
 * TabsTrigger component for triggering tab content
 */
declare const TabsTrigger: React.ForwardRefExoticComponent<TabsTriggerProps & React.RefAttributes<HTMLButtonElement>>;
/**
 * TabsContent component for displaying tab content
 */
declare const TabsContent: React.ForwardRefExoticComponent<TabsContentProps & React.RefAttributes<HTMLDivElement>>;
export { Tabs, TabsList, TabsTrigger, TabsContent };
//# sourceMappingURL=Tabs.d.ts.map