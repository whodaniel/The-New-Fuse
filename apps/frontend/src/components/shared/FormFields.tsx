// @ts-nocheck
/**
 * Form Field Components - Reusable form inputs with validation
 * Replaces corrupted Material-UI version with Tailwind + Custom Design System
 */

import { Eye, EyeOff, Plus, X } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { cn } from '../../lib/utils';
import { Slider } from '../ui/slider';

// Text Field
interface FormTextFieldProps {
  name: string;
  label: string;
  value: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'url' | 'tel';
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  autoComplete?: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FormTextField({
  name,
  label,
  value,
  type = 'text',
  required,
  disabled,
  error,
  helperText,
  multiline,
  rows = 3,
  placeholder,
  autoComplete,
  onChange,
  className,
}: FormTextFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const inputClasses = cn(
    'w-full px-3 py-2 border rounded-md transition-colors',
    'bg-transparent dark:bg-transparent',
    'text-neutral-900 dark:text-neutral-100',
    error
      ? 'border-danger-500 focus:border-danger-600 focus:ring-danger-500'
      : 'border-neutral-300 dark:border-neutral-600 focus:border-primary-500 focus:ring-primary-500',
    disabled && 'opacity-50 cursor-not-allowed bg-neutral-100 dark:bg-neutral-900',
    className
  );

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
        {label}
        {required && <span className="text-danger-500 ml-1">*</span>}
      </label>

      <div className="relative">
        {multiline ? (
          <textarea
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={inputClasses}
          />
        ) : (
          <input
            type={type === 'password' && showPassword ? 'text' : type}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            autoComplete={autoComplete}
            disabled={disabled}
            required={required}
            className={inputClasses}
          />
        )}

        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-neutral-700"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>

      {helperText && (
        <p className={cn('text-sm mt-1', error ? 'text-danger-600' : 'text-muted-foreground')}>
          {helperText}
        </p>
      )}
    </div>
  );
}

// Select Field
interface FormSelectFieldProps {
  name: string;
  label: string;
  value: string | string[];
  options: { value: string; label: string }[];
  multiple?: boolean;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  onChange: (value: string | string[]) => void;
  className?: string;
}

export function FormSelectField({
  name,
  label,
  value,
  options,
  multiple,
  required,
  disabled,
  error,
  helperText,
  onChange,
  className,
}: FormSelectFieldProps) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
        {label}
        {required && <span className="text-danger-500 ml-1">*</span>}
      </label>

      <select
        name={name}
        value={value}
        multiple={multiple}
        onChange={(e) => {
          if (multiple) {
            const selected = Array.from(e.target.selectedOptions, (option) => option.value);
            onChange(selected);
          } else {
            onChange(e.target.value);
          }
        }}
        disabled={disabled}
        required={required}
        className={cn(
          'w-full px-3 py-2 border rounded-md transition-colors',
          'bg-transparent dark:bg-transparent',
          'text-neutral-900 dark:text-neutral-100',
          error
            ? 'border-danger-500 focus:border-danger-600'
            : 'border-neutral-300 dark:border-neutral-600 focus:border-primary-500',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {helperText && (
        <p className={cn('text-sm mt-1', error ? 'text-danger-600' : 'text-muted-foreground')}>
          {helperText}
        </p>
      )}
    </div>
  );
}

// Checkbox Field
interface FormCheckboxFieldProps {
  name: string;
  label: string;
  value: boolean;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  onChange: (value: boolean) => void;
  className?: string;
}

export function FormCheckboxField({
  name,
  label,
  value,
  required,
  disabled,
  error,
  helperText,
  onChange,
  className,
}: FormCheckboxFieldProps) {
  return (
    <div className={cn('flex items-start', className)}>
      <div className="flex items-center h-5">
        <input
          type="checkbox"
          name={name}
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          required={required}
          className={cn(
            'h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
      </div>
      <div className="ml-3">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
        {helperText && (
          <p className={cn('text-sm mt-1', error ? 'text-danger-600' : 'text-muted-foreground')}>
            {helperText}
          </p>
        )}
      </div>
    </div>
  );
}

// Switch Field
interface FormSwitchFieldProps {
  name: string;
  label: string;
  value: boolean;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  onChange: (value: boolean) => void;
  className?: string;
}

export function FormSwitchField({
  name,
  label,
  value,
  required,
  disabled,
  error,
  helperText,
  onChange,
  className,
}: FormSwitchFieldProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex-1">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
        {helperText && (
          <p className={cn('text-sm mt-1', error ? 'text-danger-600' : 'text-muted-foreground')}>
            {helperText}
          </p>
        )}
      </div>
      <button
        type="button"
        name={name}
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          value ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-700',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-transparent transition-transform',
            value ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}

// Slider Field
interface FormSliderFieldProps {
  _name?: string; // Made optional and renamed to follow ESLint unused args pattern
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  onChange: (value: number) => void;
  className?: string;
}

export function FormSliderField({
  _name, // Renamed to follow ESLint unused args pattern
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  required,
  disabled,
  error,
  helperText,
  onChange,
  className,
}: FormSliderFieldProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
        <span className="text-sm text-neutral-600 dark:text-muted-foreground">{value}</span>
      </div>

      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        isDisabled={disabled}
        colorScheme="primary"
      />

      {helperText && (
        <p className={cn('text-sm mt-1', error ? 'text-danger-600' : 'text-muted-foreground')}>
          {helperText}
        </p>
      )}
    </div>
  );
}

// Array Field (for dynamic lists)
interface FormArrayFieldProps<T = any> {
  _name?: string; // Made optional and renamed to follow ESLint unused args pattern
  label: string;
  value: T[];
  renderField: (item: T, index: number) => ReactNode;
  addLabel?: string;
  removeLabel?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  onChange: (value: T[]) => void;
  className?: string;
}

export function FormArrayField<T = any>({
  _name, // Renamed to follow ESLint unused args pattern
  label,
  value,
  renderField,
  addLabel = 'Add Item',
  removeLabel = 'Remove',
  required,
  disabled,
  error,
  helperText,
  onChange,
  className,
}: FormArrayFieldProps<T>) {
  const handleAdd = () => {
    onChange([...value, null as any]);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className={cn('w-full', className)}>
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
        {label}
        {required && <span className="text-danger-500 ml-1">*</span>}
      </label>

      <div className="space-y-2">
        {value.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1">{renderField(item, index)}</div>
            <button
              type="button"
              onClick={() => handleRemove(index)}
              disabled={disabled}
              className="p-2 text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded transition-colors"
              title={removeLabel}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md hover:bg-transparent dark:hover:bg-neutral-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {addLabel}
        </button>
      </div>

      {helperText && (
        <p className={cn('text-sm mt-1', error ? 'text-danger-600' : 'text-muted-foreground')}>
          {helperText}
        </p>
      )}
    </div>
  );
}
