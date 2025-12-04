import React from 'react';
export interface CheckboxProps {
    id?: string;
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
    children?: React.ReactNode;
}
export declare const Checkbox: React.FC<CheckboxProps>;
