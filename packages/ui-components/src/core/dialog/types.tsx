import * as React from "react";
import { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

// Define dialogVariants here to avoid circular dependency
const dialogVariants = cva("fixed z-50 gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]", {
  variants: {
    size: {
      default: "w-full max-w-lg",
      sm: "w-full max-w-sm",
      lg: "w-full max-w-2xl",
      fullscreen: "w-screen h-screen",
    },
    position: {
      default: "left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]",
      top: "left-[50%] top-4 translate-x-[-50%]",
      bottom: "left-[50%] bottom-4 translate-x-[-50%]",
      left: "left-4 top-[50%] translate-y-[-50%]",
      right: "right-4 top-[50%] translate-y-[-50%]",
    },
  },
  defaultVariants: {
    size: "default",
    position: "default",
  },
});

export { dialogVariants };
export type DialogVariants = VariantProps<typeof dialogVariants>;

export type DialogSize = "default" | "sm" | "lg" | "fullscreen";

export interface BaseDialogProps extends React.ComponentProps<"div"> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  children: React.ReactNode;
}

export interface DialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement>, DialogVariants {
  onClose?: () => void;
  showCloseButton?: boolean;
}

export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
export interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
