import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
/**
 * Accordion variants using class-variance-authority
 */
export declare const accordionVariants: (props?: ({
    variant?: "default" | "bordered" | "ghost" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Accordion item variants using class-variance-authority
 */
export declare const accordionItemVariants: (props?: ({
    variant?: "default" | "bordered" | "ghost" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Accordion trigger variants using class-variance-authority
 */
export declare const accordionTriggerVariants: (props?: ({
    variant?: "default" | "bordered" | "ghost" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Accordion content variants using class-variance-authority
 */
export declare const accordionContentVariants: (props?: ({
    variant?: "default" | "bordered" | "ghost" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Accordion component props
 */
export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof accordionVariants> {
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
export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof accordionItemVariants> {
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
export interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof accordionTriggerVariants> {
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
export interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof accordionContentVariants> {
}
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
declare const Accordion: React.ForwardRefExoticComponent<AccordionProps & React.RefAttributes<HTMLDivElement>>;
/**
 * Accordion item component for containing accordion content
 */
declare const AccordionItem: React.ForwardRefExoticComponent<AccordionItemProps & React.RefAttributes<HTMLDivElement>>;
/**
 * Accordion trigger component for toggling accordion content
 */
declare const AccordionTrigger: React.ForwardRefExoticComponent<AccordionTriggerProps & React.RefAttributes<HTMLButtonElement>>;
/**
 * Accordion content component for displaying accordion content
 */
declare const AccordionContent: React.ForwardRefExoticComponent<AccordionContentProps & React.RefAttributes<HTMLDivElement>>;
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent, };
//# sourceMappingURL=Accordion.d.ts.map