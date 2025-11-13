import React from 'react';
export interface DropdownOption {
    value: string;
    label: string;
    icon?: string;
    disabled?: boolean;
}
export interface DropdownProps {
    options: DropdownOption[];
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
    className?: string;
    maxHeight?: number;
    width?: number | string;
}
export declare const Dropdown: React.FC<DropdownProps>;
//# sourceMappingURL=Dropdown.d.ts.map