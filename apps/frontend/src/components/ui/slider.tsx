// @ts-nocheck
/**
 * Slider Component - Chakra-compatible Slider for The New Fuse
 */

import { cn } from '@/lib/utils';
import React, { useState, type ChangeEvent } from 'react';

interface SliderProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  onChangeEnd?: (value: number) => void;
  isDisabled?: boolean;
  colorScheme?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Slider = ({
  value: controlledValue,
  defaultValue = 50,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  onChangeEnd,
  isDisabled = false,
  colorScheme = 'primary',
  size = 'md',
  className,
}: SliderProps) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const handleMouseUp = () => {
    onChangeEnd?.(value);
  };

  const colorClasses = {
    primary: 'accent-primary-600',
    secondary: 'accent-secondary-600',
    success: 'accent-success-600',
    warning: 'accent-warning-600',
    danger: 'accent-danger-600',
  };

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('relative w-full', className)}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp}
        disabled={isDisabled}
        className={cn(
          'w-full appearance-none bg-transparent cursor-pointer',
          '[&::-webkit-slider-track]:rounded-full [&::-webkit-slider-track]:bg-neutral-200 dark:[&::-webkit-slider-track]:bg-neutral-700',
          '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-transparent [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:shadow-md',
          '[&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-neutral-200 dark:[&::-moz-range-track]:bg-neutral-700',
          '[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-transparent [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:shadow-md',
          colorClasses[colorScheme],
          sizeClasses[size],
          isDisabled && 'opacity-50 cursor-not-allowed'
        )}
        style={{
          background: `linear-gradient(to right, var(--color-${colorScheme}-600) 0%, var(--color-${colorScheme}-600) ${percentage}%, rgb(229 231 235) ${percentage}%, rgb(229 231 235) 100%)`,
        }}
      />
    </div>
  );
};

export const SliderTrack = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const SliderFilledTrack = () => null;
export const SliderThumb = () => null;
