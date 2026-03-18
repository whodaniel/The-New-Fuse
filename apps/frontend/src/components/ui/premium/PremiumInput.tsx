// @ts-nocheck
import { LucideIcon } from 'lucide-react';
import React, { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface PremiumInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: LucideIcon | React.ElementType;
  iconPosition?: 'left' | 'right';
  containerClassName?: string;
}

/**
 * Premium Input Component with Glassmorphism
 */
export const PremiumInput: React.FC<PremiumInputProps> = ({
  label,
  error,
  hint,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  containerClassName = '',
  id,
  ...props
}) => {
  // Check if icon is a React element or a component (defensive check)
  const IconComponent = Icon ? (Icon as React.ElementType) : null;

  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-300" htmlFor={id}>
          {label}
        </label>
      )}

      <div className="relative">
        {IconComponent && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <IconComponent className="w-5 h-5 text-gray-400" />
          </div>
        )}

        <input
          id={id}
          className={`w-full px-4 py-2 bg-black/20 border border-white/10 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-200 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed ${
            IconComponent && iconPosition === 'left' ? 'pl-10' : ''
          } ${IconComponent && iconPosition === 'right' ? 'pr-10' : ''} ${error ? 'border-red-500/50' : ''} ${className}`}
          {...props}
        />

        {IconComponent && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <IconComponent className="w-5 h-5 text-gray-400" />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {hint && !error && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
};

interface PremiumTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/**
 * Premium Textarea Component
 */
export const PremiumTextarea: React.FC<PremiumTextareaProps> = ({
  label,
  error,
  hint,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-300" htmlFor={props.id}>
          {label}
        </label>
      )}

      <textarea
        className={`w-full px-4 py-2 bg-black/20 border border-white/10 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-200 backdrop-blur-sm resize-none disabled:opacity-50 disabled:cursor-not-allowed ${error ? 'border-red-500/50' : ''} ${className}`}
        {...props}
      />

      {error && <p className="text-sm text-red-400">{error}</p>}
      {hint && !error && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
};

interface PremiumSelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options?: { value: string; label: string }[];
}

/**
 * Premium Select Component
 */
export const PremiumSelect: React.FC<PremiumSelectProps> = ({
  label,
  error,
  hint,
  options = [],
  className = '',
  children,
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-300" htmlFor={props.id}>
          {label}
        </label>
      )}

      <select
        className={`w-full px-4 py-2 bg-black/20 border border-white/10 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-200 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed ${error ? 'border-red-500/50' : ''} ${className}`}
        {...props}
      >
        {children}
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-slate-800">
            {option.label}
          </option>
        ))}
      </select>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {hint && !error && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
};

interface ToggleSwitchProps {
  label?: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * Premium Toggle Switch
 */
export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) => {
  const id = React.useId();
  const labelId = `${id}-label`;
  const descId = `${id}-desc`;

  return (
    <div className="flex items-center justify-between p-4 bg-black/20 border border-white/10 rounded-md backdrop-blur-sm">
      <div className="flex-1">
        {label && <p id={labelId} className="text-sm font-medium text-white">{label}</p>}
        {description && <p id={descId} className="text-xs text-gray-400 mt-1">{description}</p>}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={label ? labelId : undefined}
        aria-describedby={description ? descId : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
          checked ? 'bg-blue-600' : 'bg-gray-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-transparent transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};
