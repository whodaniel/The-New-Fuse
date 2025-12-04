export interface KeyboardEvent {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    preventDefault: () => void;
}
export declare function handleKeyboardSubmit(event: KeyboardEvent, callback: () => void): void;
export declare function handleEscapeKey(event: KeyboardEvent, callback: () => void): void;
interface FocusTrapOptions {
    onEscape?: () => void;
    initialFocus?: string;
}
export declare function createFocusTrap(containerElement: HTMLElement, options?: FocusTrapOptions): () => void;
export declare function setAriaLabel(element: HTMLElement, label: string): void;
export declare function setAriaExpanded(element: HTMLElement, expanded: boolean): void;
export declare function setAriaHidden(element: HTMLElement, hidden: boolean): void;
export declare function setAriaSelected(element: HTMLElement, selected: boolean): void;
export declare function announceToScreenReader(message: string): void;
export declare function setupA11yTestId(component: string, element: HTMLElement): void;
export {};
