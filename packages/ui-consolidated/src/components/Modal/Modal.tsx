import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva } from 'class-variance-authority';
import { X } from 'lucide-react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { cn } from '../../utils';

/**
 * Modal overlay variants using class-variance-authority
 */
export const modalOverlayVariants = cva(
  'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm',
  {
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
  }
);

/**
 * Modal content variants using class-variance-authority
 */
export const modalContentVariants = cva(
  'relative z-50 grid w-full max-h-[85vh] overflow-auto rounded-lg border bg-background p-6 shadow-lg',
  {
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
  }
);

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
export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Modal title component props
 */
export interface ModalTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

/**
 * Modal description component props
 */
export interface ModalDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

/**
 * Modal footer component props
 */
export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Modal close button component props
 */
export interface ModalCloseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

/**
 * Modal context
 */
type ModalContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  showCloseButton: boolean;
};

const ModalContext = React.createContext<ModalContextValue | undefined>(undefined);

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
const ModalComponent = React.forwardRef<HTMLDivElement, ModalProps>(
  ({
    children,
    open = false,
    onOpenChange,
    closeOnClickOutside = true,
    closeOnEscape = true,
    showCloseButton = true,
    position = 'default',
    ..._props
  }, _ref) => {
    // Remove unused state variables
    
    // Handle escape key
    React.useEffect(() => {
      if (!open || !closeOnEscape) return;
      
      const handleEscape = (event: KeyboardEvent) => {
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
      } else {
        document.body.style.overflow = '';
      }
      
      return () => {
        document.body.style.overflow = '';
      };
    }, [open]);
    
    if (!open) return null;
    
    return (
      <ModalContext.Provider
        value={{
          open,
          setOpen: (value) => onOpenChange?.(value),
          showCloseButton,
        }}
      >
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
        >
          <div
            className={cn(modalOverlayVariants({ position }))}
            onClick={closeOnClickOutside ? () => onOpenChange?.(false) : undefined}
          >
            {children}
          </div>
        </div>
      </ModalContext.Provider>
    );
  }
);

ModalComponent.displayName = 'Modal';

/**
 * Modal content component for displaying the modal content
 */
const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(_args => {
  const { children, ...props } = _args;
  return (
    <ModalPortal>
      <ModalOverlay />
      <DialogPrimitive.Content {...props}>
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </ModalPortal>
  );
});
ModalContent.displayName = DialogPrimitive.Content.displayName;

/**
 * Modal header component for displaying the modal header
 */
const ModalHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      className
    )}
    {...props}
  />
);
ModalHeader.displayName = 'ModalHeader';

/**
 * Modal title component for displaying the modal title
 */
const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
ModalTitle.displayName = DialogPrimitive.Title.displayName;

/**
 * Modal description component for displaying the modal description
 */
const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
ModalDescription.displayName = DialogPrimitive.Description.displayName;

/**
 * Modal footer component for displaying the modal footer
 */
const ModalFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className
    )}
    {...props}
  />
);
ModalFooter.displayName = 'ModalFooter';

/**
 * Modal close button component for closing the modal
 */
const ModalCloseButton = React.forwardRef<HTMLButtonElement, ModalCloseButtonProps>(
  ({ className, onClick, ...props }, ref) => {
    const { setOpen, showCloseButton } = useModal();
    
    if (!showCloseButton) return null;
    
    return (
      <button
        ref={ref}
        className={cn(
          'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none',
          className
        )}
        onClick={(e) => {
          onClick?.(e);
          setOpen(false);
        }}
        type="button"
        aria-label="Close"
        {...props}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    );
  }
);

ModalCloseButton.displayName = 'ModalCloseButton';

// Export using a single pattern to avoid duplicate exports
/**
 * ModalPortal renders children into a React portal attached to document.body.
 */
const ModalPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (typeof window === 'undefined') return null;
  return ReactDOM.createPortal(children, document.body);
};
ModalPortal.displayName = 'ModalPortal';

/**
 * ModalOverlay renders the modal overlay using the modalOverlayVariants.
 */
const ModalOverlay: React.FC<{ position?: 'default' | 'top' | 'bottom' }> = ({ position = 'default' }) => (
  <div className={cn(modalOverlayVariants({ position }))} />
);
ModalOverlay.displayName = 'ModalOverlay';

export {
  ModalComponent as Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalCloseButton,
  ModalPortal,
  ModalOverlay,
};
