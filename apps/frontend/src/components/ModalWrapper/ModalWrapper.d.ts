import { ReactNode } from "react";
interface ModalWrapperProps {
    /**
     * The DOM/JSX to render
     */
    children: ReactNode;
    /**
     * Option that renders the modal
     */
    isOpen: boolean;
    /**
     * Used for creating sub-DOM modals that need to be rendered as a child element instead of a modal placed at the root
     * Note: This can impact the bg-overlay presentation due to conflicting DOM positions so if using this property you should
     * double check it renders as desired.
     * @default false
     */
    noPortal?: boolean;
}
/**
 * ModalWrapper component that wraps the consolidated Modal component
 * This maintains backward compatibility with the old ModalWrapper API
 */
export declare function ModalWrapper({ children, isOpen, noPortal }: ModalWrapperProps): import("react/jsx-runtime").JSX.Element | null;
export {};
