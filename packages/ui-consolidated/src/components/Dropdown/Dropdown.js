import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@the-new-fuse/utils';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../Icon';
export const Dropdown = ({ options, value, onChange, placeholder = 'Select an option', label, error, disabled = false, className, maxHeight = 250, width, }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState(value ? options.find((option) => option.value === value) : undefined);
    const dropdownRef = useRef(null);
    // Update selected option when value prop changes
    useEffect(() => {
        if (value) {
            const option = options.find((option) => option.value === value);
            setSelectedOption(option);
        }
        else {
            setSelectedOption(undefined);
        }
    }, [value, options]);
    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    const handleOptionClick = (option) => {
        if (option.disabled)
            return;
        setSelectedOption(option);
        setIsOpen(false);
        if (onChange) {
            onChange(option.value);
        }
    };
    const toggleDropdown = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
        }
    };
    return (_jsxs("div", { className: cn('relative w-full', className), ref: dropdownRef, style: { width }, children: [label && (_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: label })), _jsxs("button", { type: "button", className: cn('flex items-center justify-between w-full px-3 py-2 text-left rounded-md border shadow-sm text-sm', 'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent', disabled && 'opacity-50 cursor-not-allowed', error ? 'border-red-500' : 'border-input', 'bg-background text-foreground'), onClick: toggleDropdown, disabled: disabled, children: [_jsxs("div", { className: "flex items-center gap-2 truncate", children: [selectedOption?.icon && (_jsx(Icon, { name: selectedOption.icon, size: "sm", className: "shrink-0" })), _jsx("span", { className: !selectedOption ? 'text-gray-400' : '', children: selectedOption ? selectedOption.label : placeholder })] }), _jsx(Icon, { name: isOpen ? 'chevron-up' : 'chevron-down', size: "sm", className: "ml-2 shrink-0" })] }), isOpen && (_jsx("div", { className: "absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100", style: { maxHeight, overflowY: 'auto' }, children: _jsx("ul", { className: "py-1", children: options.map((option) => (_jsxs("li", { className: cn('flex items-center px-3 py-2 text-sm cursor-pointer', option.disabled
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700', selectedOption?.value === option.value && 'bg-primary/10 text-primary'), onClick: () => handleOptionClick(option), children: [option.icon && _jsx(Icon, { name: option.icon, size: "sm", className: "mr-2 shrink-0" }), _jsx("span", { className: "truncate", children: option.label })] }, option.value))) }) })), error && _jsx("p", { className: "mt-1 text-xs text-red-500", children: error })] }));
};
