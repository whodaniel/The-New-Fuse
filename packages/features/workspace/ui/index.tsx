import React from 'react';

export const Button = ({ children, onClick, className, variant, ...props }: any) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded transition-colors ${className} ${variant === 'primary' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-black dark:text-white'}`}
    {...props}
  >
    {children}
  </button>
);

export const Card = ({ children, className, ...props }: any) => (
  <div className={`border rounded-lg shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${className}`} {...props}>
    {children}
  </div>
);
