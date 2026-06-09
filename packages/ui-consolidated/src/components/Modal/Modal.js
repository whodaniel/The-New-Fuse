import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva } from 'class-variance-authority';
import { X } from 'lucide-react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { cn } from '../../utils';
/**
 * Modal overlay variants using class-variance-authority
 */
export const modalOverlayVariants = cva('fixed inset-0 z-50 bg-background/80 backdrop-blur-sm', {
    variants: {
        position: {
            default: 'flex items-center justify-center',
            top: 'flex items-start justify-center pt-16',
            bottom: 'flex items-end justify-center pb-16',
        },
    },
    defaultVariants: {
        position: 'default',
    },
});
/**
 * Modal content variants using class-variance-authority
 */
export const modalContentVariants = cva('relative z-50 grid w-full max-h-[85vh] overflow-auto rounded-lg border bg-background p-6 shadow-lg', {
    variants: {
        size: {
            sm: 'max-w-sm',
            md: 'max-w-md',
            lg: 'max-w-lg',
            xl: 'max-w-xl',
            '2xl': 'max-w-2xl',
            '3xl': 'max-w-3xl',
            '4xl': 'max-w-4xl',
            '5xl': 'max-w-5xl',
            full: 'max-w-full',
        },
    },
    defaultVariants: {
        size: 'md',
    },
});
const ModalContext = React.createContext(undefined);
const useModal = () => {
    const context = React.useContext(ModalContext);
    if (!context) {
        throw new Error('Modal components must be used within a Modal component');
    }
    return context;
};
/**
 * Modal component for displaying a modal dialog
 */
const ModalComponent = React.forwardRef(({ children, open = false, onOpenChange, closeOnClickOutside = true, closeOnEscape = true, showCloseButton = true, position = 'default', ...props }, ref) => {
    // Remove unused state variables
    // Handle escape key
    React.useEffect(() => {
        if (!open || !closeOnEscape)
            return;
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onOpenChange?.(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [open, closeOnEscape, onOpenChange]);
    // Prevent body scroll when modal is open
    React.useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        }
        else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);
    if (!open)
        return null;
    return (_jsx(ModalContext.Provider, { value: {
            open,
            setOpen: (value) => onOpenChange?.(value),
            showCloseButton,
        }, children: _jsx("div", { ref: ref, className: "fixed inset-0 z-50", role: "dialog", "aria-modal": "true", ...props, children: _jsx("div", { className: cn(modalOverlayVariants({ position })), onClick: closeOnClickOutside ? () => onOpenChange?.(false) : undefined, children: children }) }) }));
});
ModalComponent.displayName = 'Modal';
/**
 * Modal content component for displaying the modal content
 */
const ModalContent = React.forwardRef(_args => {
    const { children, ...props } = _args;
    return (_jsxs(ModalPortal, { children: [_jsx(ModalOverlay, {}), _jsxs(DialogPrimitive.Content, { ...props, children: [children, _jsxs(DialogPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground", children: [_jsx(X, { className: "h-4 w-4" }), _jsx("span", { className: "sr-only", children: "Close" })] })] })] }));
});
ModalContent.displayName = DialogPrimitive.Content.displayName;
/**
 * Modal header component for displaying the modal header
 */
const ModalHeader = ({ className, ...props }) => (_jsx("div", { className: cn('flex flex-col space-y-1.5 text-center sm:text-left', className), ...props }));
ModalHeader.displayName = 'ModalHeader';
/**
 * Modal title component for displaying the modal title
 */
const ModalTitle = React.forwardRef(({ className, ...props }, ref) => (_jsx(DialogPrimitive.Title, { ref: ref, className: cn('text-lg font-semibold leading-none tracking-tight', className), ...props })));
ModalTitle.displayName = DialogPrimitive.Title.displayName;
/**
 * Modal description component for displaying the modal description
 */
const ModalDescription = React.forwardRef(({ className, ...props }, ref) => (_jsx(DialogPrimitive.Description, { ref: ref, className: cn('text-sm text-muted-foreground', className), ...props })));
ModalDescription.displayName = DialogPrimitive.Description.displayName;
/**
 * Modal footer component for displaying the modal footer
 */
const ModalFooter = ({ className, ...props }) => (_jsx("div", { className: cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className), ...props }));
ModalFooter.displayName = 'ModalFooter';
/**
 * Modal close button component for closing the modal
 */
const ModalCloseButton = React.forwardRef(({ className, onClick, ...props }, ref) => {
    const { setOpen, showCloseButton } = useModal();
    if (!showCloseButton)
        return null;
    return (_jsx("button", { ref: ref, className: cn('absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none', className), onClick: (e) => {
            onClick?.(e);
            setOpen(false);
        }, type: "button", "aria-label": "Close", ...props, children: _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "h-4 w-4", children: [_jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), _jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })] }) }));
});
ModalCloseButton.displayName = 'ModalCloseButton';
// Export using a single pattern to avoid duplicate exports
/**
 * ModalPortal renders children into a React portal attached to document.body.
 */
const ModalPortal = ({ children }) => {
    if (typeof window === 'undefined')
        return null;
    return ReactDOM.createPortal(children, document.body);
};
ModalPortal.displayName = 'ModalPortal';
/**
 * ModalOverlay renders the modal overlay using the modalOverlayVariants.
 */
const ModalOverlay = ({ position = 'default' }) => (_jsx("div", { className: cn(modalOverlayVariants({ position })) }));
ModalOverlay.displayName = 'ModalOverlay';
export { ModalComponent as Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter, ModalCloseButton, ModalPortal, ModalOverlay, };
