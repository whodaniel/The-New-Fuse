import React from "react";
export type InputSource = "user" | "ai" | "web" | "chrome-extension" | "relay" | "vscode-extension" | "terminal" | string;
export type InputDestination = "ai" | "user" | "web" | "chrome-extension" | "relay" | "vscode-extension" | "terminal" | string;
export interface UniversalInputProps {
    value: string;
    onChange: (value: string, meta?: {
        source?: InputSource;
        destination?: InputDestination;
    }) => void;
    source?: InputSource;
    destination?: InputDestination;
    type?: React.HTMLInputTypeAttribute;
    placeholder?: string;
    disabled?: boolean;
    autoFocus?: boolean;
    className?: string;
    style?: React.CSSProperties;
    [key: string]: any;
}
/**
 * UniversalInput
 * A custom, extensible input component for consistent user/AI/web/extension/relay/terminal input/output.
 * Designed for easy integration with web forms, browser extensions, and backend services.
 */
export declare const UniversalInput: React.ForwardRefExoticComponent<Omit<UniversalInputProps, "ref"> & React.RefAttributes<HTMLInputElement>>;
