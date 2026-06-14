import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
const EditableText = ({ initialValue, onSave, className, inputClassName, placeholder, disabled }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef(null);
    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);
    const handleDoubleClick = () => {
        if (disabled)
            return; // Prevent editing if disabled
        setIsEditing(true);
    };
    const handleChange = (e) => {
        setValue(e.target.value);
    };
    const handleBlur = () => {
        if (value.trim() === '') {
            setValue(initialValue); // Revert if empty
        }
        else if (value !== initialValue) {
            onSave(value);
        }
        setIsEditing(false);
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (value.trim() === '') {
                setValue(initialValue);
            }
            else if (value !== initialValue) {
                onSave(value);
            }
            setIsEditing(false);
        }
        else if (e.key === 'Escape') {
            setValue(initialValue);
            setIsEditing(false);
        }
    };
    if (isEditing) {
        return (_jsx("input", { ref: inputRef, type: "text", value: value, onChange: handleChange, onBlur: handleBlur, onKeyDown: handleKeyDown, className: `p-1 border border-sky-500 rounded bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 ${inputClassName}`, placeholder: placeholder, readOnly: disabled }));
    }
    return (_jsx("span", { onDoubleClick: handleDoubleClick, className: `cursor-pointer p-1 hover:bg-slate-100 rounded ${className} ${disabled ? 'cursor-not-allowed opacity-70' : ''}`, title: disabled ? undefined : "Double-click to edit", children: value || placeholder || "Untitled" }));
};
export default EditableText;
//# sourceMappingURL=EditableText.js.map