import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn'; // Fixed import path
const dialogVariants = cva('fixed z-50 gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]', {
    variants: {
        size: {
            default: 'w-full max-w-lg',
            sm: 'w-full max-w-sm',
            lg: 'w-full max-w-2xl',
            xl: 'w-full max-w-4xl',
            fullscreen: 'w-screen h-screen',
        },
        position: {
            default: 'left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]',
            top: 'left-[50%] top-4 translate-x-[-50%]',
            bottom: 'left-[50%] bottom-4 translate-x-[-50%]',
            left: 'left-4 top-[50%] translate-y-[-50%]',
            right: 'right-4 top-[50%] translate-y-[-50%]',
            custom: '',
        },
    },
    defaultVariants: {
        size: 'default',
        position: 'default',
    },
});
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;
const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (_jsx(DialogPrimitive.Overlay, { ref: ref, className: cn('fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', className), ...props })));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
const DialogContent = React.forwardRef(({ className, children, size = 'default', position = 'default', showCloseButton = true, onClose, customPosition, ...props }, ref) => (_jsxs(DialogPortal, { children: [_jsx(DialogOverlay, {}), _jsxs(DialogPrimitive.Content, { ref: ref, style: position === 'custom' ? customPosition : undefined, className: cn(dialogVariants({ size, position }), className), ...props, children: [children, showCloseButton && (_jsxs(DialogPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground", onClick: onClose, children: [_jsx(X, { className: "h-4 w-4" }), _jsx("span", { className: "sr-only", children: "Close" })] }))] })] })));
DialogContent.displayName = 'DialogContent';
const DialogHeader = ({ className, ...props }) => (_jsx("div", { className: cn('flex flex-col space-y-1.5 text-center sm:text-left', className), ...props }));
DialogHeader.displayName = 'DialogHeader';
const DialogFooter = ({ className, ...props }) => (_jsx("div", { className: cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className), ...props }));
DialogFooter.displayName = 'DialogFooter';
const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (_jsx(DialogPrimitive.Title, { ref: ref, className: cn('text-lg font-semibold leading-none tracking-tight', className), ...props })));
DialogTitle.displayName = DialogPrimitive.Title.displayName;
const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (_jsx(DialogPrimitive.Description, { ref: ref, className: cn('text-sm text-muted-foreground', className), ...props })));
DialogDescription.displayName = DialogPrimitive.Description.displayName;
const Modal = ({ isOpen, onClose, title, size = 'default', position = 'default', customPosition, closeOnBackdropClick = true, closeOnEscape = true, className, children, }) => {
    return (_jsx(Dialog, { open: isOpen, onOpenChange: (open) => !open && onClose(), modal: true, children: _jsxs(DialogContent, { size: size, position: position, customPosition: customPosition, onEscapeKeyDown: (e) => !closeOnEscape && e.preventDefault(), onPointerDownOutside: (e) => !closeOnBackdropClick && e.preventDefault(), onClose: onClose, className: className, children: [title && (_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: title }) })), _jsx("div", { className: "mt-2", children: children })] }) }));
};
export { Dialog, DialogPortal, DialogOverlay, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, Modal, dialogVariants, };
