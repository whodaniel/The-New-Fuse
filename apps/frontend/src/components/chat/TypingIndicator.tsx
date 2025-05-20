import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface TypingIndicatorProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  label?: string;
  showLabel?: boolean;
}

export const TypingIndicator: React.React.FC<TypingIndicatorProps> = ({
  className,
  size = 'md',
  color = 'bg-gray-400',
  label = 'Typing',
  showLabel = false,
}) => {
  const sizeClasses = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={cn(
              sizeClasses[size],
              color,
              'rounded-full'
            )}
            animate={{
              y: ['0%', '-50%', '0%'],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      {showLabel && (
        <span className="text-sm text-gray-500 animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
};

// Usage example:
export const TypingIndicatorExample: React.React.FC<{}> = () => {
  return (
    <div className="space-y-4">
      <TypingIndicator 
        size="sm"
        color="bg-blue-400"
      />
      <TypingIndicator 
        size="md"
        color="bg-green-400"
        showLabel
        label="Agent is thinking..."
      />
      <TypingIndicator 
        size="lg"
        color="bg-purple-400"
        className="p-4 bg-gray-100 rounded-lg"
      />
    </div>
  );
};
