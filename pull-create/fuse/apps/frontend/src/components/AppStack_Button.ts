import React from 'react';

export const AppStack_Button = ({
  onClick,
  variant = 'default',
  children,
  disabled,
  className = '',
}: any) => {
  const baseStyles = 'p-2 rounded transition-all duration-200';
  const variantStyles =
    variant === 'destructive'
      ? 'bg-red-500 hover:bg-red-600 text-white'
      : 'bg-blue-500 hover:bg-blue-600 text-white';
  return React.createElement(
    'button',
    {
      onClick: onClick,
      className: `${baseStyles} ${variantStyles} ${className}`,
      disabled: disabled,
    },
    children
  );
};
