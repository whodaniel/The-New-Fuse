import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from './Icons';
const SelectInput = ({ options, value, onChange, placeholder = "Select...", className = '', disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);
    const selectedOption = options.find(opt => opt.value === value);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);
    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
    };
    return (_jsxs("div", { className: `relative ${className}`, ref: wrapperRef, children: [_jsxs("button", { type: "button", disabled: disabled, className: `w-full flex items-center justify-between text-left px-3 py-2 text-sm border rounded-md shadow-sm transition-colors
                    ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500'}`, onClick: () => setIsOpen(!isOpen), children: [_jsx("span", { className: "truncate", children: selectedOption ? selectedOption.label : _jsx("span", { className: "text-slate-400", children: placeholder }) }), _jsx(ChevronDownIcon, { className: `w-4 h-4 ml-2 text-slate-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}` })] }), isOpen && !disabled && (_jsxs("ul", { className: "absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm custom-scrollbar", children: [options.map((option) => (_jsx("li", { className: `cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-sky-100 hover:text-sky-900 text-slate-800 ${option.colorClass || ''}`, onClick: () => handleSelect(option.value), children: _jsx("span", { className: `block truncate ${selectedOption?.value === option.value ? 'font-semibold' : 'font-normal'}`, children: option.label }) }, option.value))), options.length === 0 && (_jsx("li", { className: "cursor-default select-none relative py-2 pl-3 pr-9 text-slate-500", children: "No options" }))] }))] }));
};
export default SelectInput;
//# sourceMappingURL=SelectInput.js.map