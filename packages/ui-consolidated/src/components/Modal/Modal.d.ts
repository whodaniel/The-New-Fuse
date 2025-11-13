import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as React from 'react';
/**
 * Modal overlay variants using class-variance-authority
 */
export declare const modalOverlayVariants: (props?: ({
    position?: "default" | "bottom" | "top" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Modal content variants using class-variance-authority
 */
export declare const modalContentVariants: (props?: ({
    size?: "full" | "md" | "sm" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Modal component props
 */
export interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * Whether the modal is open
     */
    open?: boolean;
    /**
     * Callback when the modal open state changes
     */
    onOpenChange?: (open: boolean) => void;
    /**
     * Whether to close the modal when clicking outside
     * @default true
     */
    closeOnClickOutside?: boolean;
    /**
     * Whether to close the modal when pressing escape
     * @default true
     */
    closeOnEscape?: boolean;
    /**
     * Whether to show the close button
     * @default true
     */
    showCloseButton?: boolean;
    /**
     * Position of the modal
     */
    position?: 'default' | 'top' | 'bottom';
}
/**
 * Modal content component props
 */
export interface ModalContentProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * Size of the modal
     */
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
}
/**
 * Modal header component props
 */
export type ModalHeaderProps = React.HTMLAttributes<HTMLDivElement>;
/**
 * Modal title component props
 */
export type ModalTitleProps = React.HTMLAttributes<HTMLHeadingElement>;
/**
 * Modal description component props
 */
export type ModalDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;
/**
 * Modal footer component props
 */
export type ModalFooterProps = React.HTMLAttributes<HTMLDivElement>;
/**
 * Modal close button component props
 */
export type ModalCloseButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
/**
 * Modal component for displaying a modal dialog
 */
declare const ModalComponent: React.ForwardRefExoticComponent<ModalProps & React.RefAttributes<HTMLDivElement>>;
/**
 * Modal content component for displaying the modal content
 */
declare const ModalContent: React.ForwardRefExoticComponent<ModalContentProps & React.RefAttributes<HTMLDivElement>>;
/**
 * Modal header component for displaying the modal header
 */
declare const ModalHeader: {
    ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element;
    displayName: string;
};
/**
 * Modal title component for displaying the modal title
 */
declare const ModalTitle: React.ForwardRefExoticComponent<Omit<DialogPrimitive.DialogTitleProps & React.RefAttributes<HTMLHeadingElement>, "ref"> & React.RefAttributes<HTMLHeadingElement>>;
/**
 * Modal description component for displaying the modal description
 */
declare const ModalDescription: React.ForwardRefExoticComponent<Omit<DialogPrimitive.DialogDescriptionProps & React.RefAttributes<HTMLParagraphElement>, "ref"> & React.RefAttributes<HTMLParagraphElement>>;
/**
 * Modal footer component for displaying the modal footer
 */
declare const ModalFooter: {
    ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element;
    displayName: string;
};
/**
 * Modal close button component for closing the modal
 */
declare const ModalCloseButton: React.ForwardRefExoticComponent<ModalCloseButtonProps & React.RefAttributes<HTMLButtonElement>>;
/**
 * ModalPortal renders children into a React portal attached to document.body.
 */
declare const ModalPortal: React.FC<{
    children: React.ReactNode;
}>;
/**
 * ModalOverlay renders the modal overlay using the modalOverlayVariants.
 */
declare const ModalOverlay: React.FC<{
    position?: 'default' | 'top' | 'bottom';
}>;
export { ModalComponent as Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter, ModalCloseButton, ModalPortal, ModalOverlay, };
//# sourceMappingURL=Modal.d.ts.map