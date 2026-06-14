import React from 'react';
export interface SelectOptionItem {
    value: string;
    label: string | React.ReactNode;
    colorClass?: string;
}
interface SelectInputProps {
    options: SelectOptionItem[];
    value: string | undefined;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}
declare const SelectInput: React.FC<SelectInputProps>;
export default SelectInput;
//# sourceMappingURL=SelectInput.d.ts.map