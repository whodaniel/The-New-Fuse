import { LucideIcon } from 'lucide-react';
import React, { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface PremiumInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
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
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-300" htmlFor={props.id}>
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Icon className="w-5 h-5 text-gray-400" />
          </div>
        )}

        <input
          className={`w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-200 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed ${
            Icon && iconPosition === 'left' ? 'pl-10' : ''
          } ${Icon && iconPosition === 'right' ? 'pr-10' : ''} ${error ? 'border-red-500/50' : ''} ${className}`}
          {...props}
        />

        {Icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Icon className="w-5 h-5 text-gray-400" />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {hint && !error && <p className="text-sm text-gray-500">{hint}</p>}
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
        className={`w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-200 backdrop-blur-sm resize-none disabled:opacity-50 disabled:cursor-not-allowed ${error ? 'border-red-500/50' : ''} ${className}`}
        {...props}
      />

      {error && <p className="text-sm text-red-400">{error}</p>}
      {hint && !error && <p className="text-sm text-gray-500">{hint}</p>}
    </div>
  );
};

interface PremiumSelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
}

/**
 * Premium Select Component
 */
export const PremiumSelect: React.FC<PremiumSelectProps> = ({
  label,
  error,
  hint,
  options,
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

      <select
        className={`w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-200 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed ${error ? 'border-red-500/50' : ''} ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-slate-800">
            {option.label}
          </option>
        ))}
      </select>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {hint && !error && <p className="text-sm text-gray-500">{hint}</p>}
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
  return (
    <div className="flex items-center justify-between p-4 bg-black/20 border border-white/10 rounded-lg backdrop-blur-sm">
      <div className="flex-1">
        {label && <p className="text-sm font-medium text-white">{label}</p>}
        {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
          checked ? 'bg-blue-600' : 'bg-gray-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};
