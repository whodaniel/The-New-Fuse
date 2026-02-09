// UniversalInput.tsx
import React, { ChangeEvent, forwardRef } from "react";

export type InputSource =
  | "user"
  | "ai"
  | "web"
  | "chrome-extension"
  | "relay"
  | "vscode-extension"
  | "terminal"
  | string;

export type InputDestination =
  | "ai"
  | "user"
  | "web"
  | "chrome-extension"
  | "relay"
  | "vscode-extension"
  | "terminal"
  | string;

export interface UniversalInputProps {
  value: string;
  onChange: (value: string, meta?: { source?: InputSource; destination?: InputDestination }) => void;
  source?: InputSource;
  destination?: InputDestination;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  style?: React.CSSProperties;
  // For extensibility: allow passing extra props for integration
  [key: string]: any;
}

/**
 * UniversalInput
 * A custom, extensible input component for consistent user/AI/web/extension/relay/terminal input/output.
 * Designed for easy integration with web forms, browser extensions, and backend services.
 */
export const UniversalInput = forwardRef<HTMLInputElement, UniversalInputProps>(
  (
    {
      value,
      onChange,
      source = "user",
      destination = "ai",
      type = "text",
      placeholder = "",
      disabled = false,
      autoFocus = false,
      className = "",
      style = {},
      ...rest
    },
    ref
  ) => {
    // Handler to provide meta info on change
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value, { source, destination });
    };

    return (
      <input
        ref={ref}
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={className}
        style={style}
        data-input-source={source}
        data-input-destination={destination}
        {...rest}
      />
    );
  }
);

UniversalInput.displayName = "UniversalInput";