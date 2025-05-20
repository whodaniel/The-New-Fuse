import React, { ReactNode } from "react";
interface ModalWrapperProps {
    children: ReactNode;
    isOpen: boolean;
    noPortal?: boolean;
}
export declare function ModalWrapper({ children, isOpen, noPortal }: ModalWrapperProps): React.JSX.Element | null;
export {};
