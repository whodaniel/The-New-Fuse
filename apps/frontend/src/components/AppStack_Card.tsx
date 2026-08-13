// @ts-nocheck
Object.defineProperty(exports, '__esModule', { value: true });

export const AppStack_Card = ({ children, variant = 'default', className = '' }) => {
  const baseStyles = 'rounded-md transition-all duration-200';
  const variantStyles = {
    default: 'bg-transparent border shadow-none hover:shadow-none',
    gradient:
      'bg-gradient-to-br from-white to-gray-50 border border-gray-100 shadow-none hover:shadow-none',
    hover:
      'bg-transparent border hover:border-blue-500 shadow-none hover:shadow-none hover:scale-[1.02]',
  };
  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className} p-4`}>{children}</div>
  );
};
export const AppStack_CardHeader = ({ children, className = '' }) => {
  return <div className={`space-y-1.5 mb-4 ${className}`}>{children}</div>;
};
export const AppStack_CardTitle = ({ children, className = '' }) => {
  return (
    <h3 className={`text-2xl font-semibold tracking-tight text-gray-900 ${className}`}>
      {children}
    </h3>
  );
};
export const AppStack_CardDescription = ({ children, className = '' }) => {
  return <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>;
};
export const AppStack_CardContent = ({ children, className = '' }) => {
  return <div className={className}>{children}</div>;
};
