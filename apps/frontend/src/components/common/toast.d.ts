import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { type VariantProps } from 'class-variance-authority';
export declare const ToastProvider: React.FC<React.ComponentProps<typeof ToastPrimitives.Provider>>;
export declare const ToastViewport: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport> & React.RefAttributes<HTMLOListElement>>;
declare const toastVariants: (props?: ({
    variant?: "default" | "destructive" | null | undefined;
} & import("class-variance-authority/dist/types").ClassProp) | undefined) => string;
export interface ToastProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>, VariantProps<typeof toastVariants> {
}
export declare const Toast: React.ForwardRefExoticComponent<ToastProps & React.RefAttributes<HTMLLIElement>>;
export declare const ToastTitle: React.ForwardRefExoticComponent<Omit<ToastPrimitives.ToastTitleProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
export declare const ToastDescription: React.ForwardRefExoticComponent<Omit<ToastPrimitives.ToastDescriptionProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
export declare const ToastClose: React.ForwardRefExoticComponent<Omit<ToastPrimitives.ToastCloseProps & React.RefAttributes<HTMLButtonElement>, "ref"> & React.RefAttributes<HTMLButtonElement>>;
export declare const ToastAction: React.ForwardRefExoticComponent<Omit<ToastPrimitives.ToastActionProps & React.RefAttributes<HTMLButtonElement>, "ref"> & React.RefAttributes<HTMLButtonElement>>;
export {};
