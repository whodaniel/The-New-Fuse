import React from 'react';

export interface RadioProps {
  id?: string;
  value: string | number;
  checked?: boolean;
  onCheckedChange?: (value: string | number) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const Radio: React.FC<RadioProps> = ({
  id,
  value,
  checked = false,
  onCheckedChange,
  disabled = false,
  className = '',
  children,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onCheckedChange && !disabled) {
      onCheckedChange(value);
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <input
        id={id}
        type="radio"
        value={value}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
      />
      {children && (
        <label htmlFor={id} className="ml-2 text-sm text-gray-900">
          {children}
        </label>
      )}
    </div>
  );
};
