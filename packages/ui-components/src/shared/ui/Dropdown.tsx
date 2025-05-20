import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils.js';
import { Icon } from './Icon.js';

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

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  disabled = false,
  className,
  maxHeight = 250,
  width,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<DropdownOption | undefined>(
    value ? options.find(option => option.value === value) : undefined
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update selected option when value prop changes
  useEffect(() => {
    if (value) {
      const option = options.find(option => option.value === value);
      setSelectedOption(option);
    } else {
      setSelectedOption(undefined);
    }
  }, [value, options]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionClick = (option: DropdownOption) => {
    if (option.disabled) return;
    
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

  return (
    <div 
      className={cn(
        "relative w-full", 
        className
      )}
      ref={dropdownRef}
      style={{ width }}
    >
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      
      <button
        type="button"
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 text-left rounded-md border shadow-sm text-sm",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
          disabled && "opacity-50 cursor-not-allowed",
          error ? "border-red-500" : "border-input",
          "bg-background text-foreground"
        )}
        onClick={toggleDropdown}
        disabled={disabled}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <Icon name={selectedOption.icon} size="sm" className="shrink-0" />
          )}
          <span className={!selectedOption ? "text-gray-400" : ""}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        
        <Icon 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size="sm" 
          className="ml-2 shrink-0"
        />
      </button>
      
      {isOpen && (
        <div 
          className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700"
          style={{ maxHeight, overflowY: 'auto' }}
        >
          <ul className="py-1">
            {options.map((option) => (
              <li 
                key={option.value}
                className={cn(
                  "flex items-center px-3 py-2 text-sm cursor-pointer",
                  option.disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100 dark:hover:bg-gray-700",
                  selectedOption?.value === option.value && "bg-primary/10 text-primary"
                )}
                onClick={() => handleOptionClick(option)}
              >
                {option.icon && (
                  <Icon name={option.icon} size="sm" className="mr-2 shrink-0" />
                )}
                <span className="truncate">{option.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {error && (
        <p className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};