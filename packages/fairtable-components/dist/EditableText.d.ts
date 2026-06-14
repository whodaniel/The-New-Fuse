import React from 'react';
interface EditableTextProps {
    initialValue: string;
    onSave: (value: string) => void;
    className?: string;
    inputClassName?: string;
    placeholder?: string;
    disabled?: boolean;
}
declare const EditableText: React.FC<EditableTextProps>;
export default EditableText;
//# sourceMappingURL=EditableText.d.ts.map