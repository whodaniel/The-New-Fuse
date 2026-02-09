
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from './Icons';

export interface SelectOptionItem {
  value: string;
  label: string | React.ReactNode; // Allow ReactNode for richer labels (e.g. with color swatches)
  colorClass?: string; // Optional specific class for the option item itself
}

interface SelectInputProps {
  options: SelectOptionItem[];
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const SelectInput: React.FC<SelectInputProps> = ({ options, value, onChange, placeholder = "Select...", className = '', disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <button
        type="button"
        disabled={disabled}
        className={`w-full flex items-center justify-between text-left px-3 py-2 text-sm border rounded-md shadow-sm transition-colors
                    ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">
            {selectedOption ? selectedOption.label : <span className="text-slate-400">{placeholder}</span>}
        </span>
        <ChevronDownIcon className={`w-4 h-4 ml-2 text-slate-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>
      {isOpen && !disabled && (
        <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm custom-scrollbar">
          {options.map((option) => (
            <li
              key={option.value}
              className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-sky-100 hover:text-sky-900 text-slate-800 ${option.colorClass || ''}`}
              onClick={() => handleSelect(option.value)}
            >
              <span className={`block truncate ${selectedOption?.value === option.value ? 'font-semibold' : 'font-normal'}`}>
                {option.label}
              </span>
            </li>
          ))}
          {options.length === 0 && (
            <li className="cursor-default select-none relative py-2 pl-3 pr-9 text-slate-500">
              No options
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default SelectInput;

