import React from 'react';
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    value?: string;
    onChange?: (value: string) => void;
    onValueChange?: (value: string) => void;
    className?: string;
    children: React.ReactNode;
}
declare const Select: React.ForwardRefExoticComponent<SelectProps & React.RefAttributes<HTMLSelectElement>>;
interface SelectRootProps {
    value?: string;
    onValueChange?: (value: string) => void;
    children: React.ReactNode;
    defaultValue?: string;
}
declare const SelectRoot: React.FC<SelectRootProps>;
interface SelectTriggerProps {
    className?: string;
    children: React.ReactNode;
}
declare const SelectTrigger: React.FC<SelectTriggerProps>;
interface SelectValueProps {
    placeholder?: string;
}
declare const SelectValue: React.FC<SelectValueProps>;
interface SelectContentProps {
    className?: string;
    children: React.ReactNode;
}
declare const SelectContent: React.FC<SelectContentProps>;
interface SelectItemProps {
    value: string;
    className?: string;
    children: React.ReactNode;
}
declare const SelectItem: React.FC<SelectItemProps>;
export { Select, SelectRoot as SelectContainer, SelectTrigger, SelectContent, SelectItem, SelectValue };
export default Select;
