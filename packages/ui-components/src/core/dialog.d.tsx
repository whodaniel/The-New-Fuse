import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
declare const Root: React.FC<DialogPrimitive.DialogProps>;
declare const Portal: React.FC<DialogPrimitive.DialogPortalProps>;
declare const Overlay: React.ForwardRefExoticComponent<React.RefAttributes<unknown>>;
declare const Content: React.ForwardRefExoticComponent<React.RefAttributes<unknown>>;
declare const Header: React.FC<React.HTMLAttributes<HTMLDivElement>> & {
    displayName: string;
};
declare const Footer: React.FC<React.HTMLAttributes<HTMLDivElement>> & {
    displayName: string;
};
declare const Title: React.ForwardRefExoticComponent<React.RefAttributes<unknown>>;
declare const Description: React.ForwardRefExoticComponent<React.RefAttributes<unknown>>;
export { Root, Portal, Overlay, Content, Header, Footer, Title, Description, };
