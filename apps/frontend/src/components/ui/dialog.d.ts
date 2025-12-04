import React from 'react';
interface DialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
}
interface DialogContentProps {
    className?: string;
    children: React.ReactNode;
}
interface DialogHeaderProps {
    children: React.ReactNode;
}
interface DialogTitleProps {
    children: React.ReactNode;
}
interface DialogDescriptionProps {
    children: React.ReactNode;
}
interface DialogFooterProps {
    children: React.ReactNode;
}
interface DialogTriggerProps {
    asChild?: boolean;
    children: React.ReactNode;
}
export declare function Dialog({ open, onOpenChange, children }: DialogProps): import("react/jsx-runtime").JSX.Element | null;
export declare function DialogContent({ className, children }: DialogContentProps): import("react/jsx-runtime").JSX.Element;
export declare function DialogHeader({ children }: DialogHeaderProps): import("react/jsx-runtime").JSX.Element;
export declare function DialogTitle({ children }: DialogTitleProps): import("react/jsx-runtime").JSX.Element;
export declare function DialogDescription({ children }: DialogDescriptionProps): import("react/jsx-runtime").JSX.Element;
export declare function DialogFooter({ children }: DialogFooterProps): import("react/jsx-runtime").JSX.Element;
export declare function DialogTrigger({ asChild, children }: DialogTriggerProps): import("react/jsx-runtime").JSX.Element;
interface DialogCloseProps {
    asChild?: boolean;
    children: React.ReactNode;
}
export declare function DialogClose({ asChild, children }: DialogCloseProps): import("react/jsx-runtime").JSX.Element;
export default Dialog;
export declare const Root: typeof Dialog;
export declare const Content: typeof DialogContent;
export declare const Header: typeof DialogHeader;
export declare const Title: typeof DialogTitle;
export declare const Description: typeof DialogDescription;
export declare const Footer: typeof DialogFooter;
export declare const Trigger: typeof DialogTrigger;
export declare const Close: typeof DialogClose;
