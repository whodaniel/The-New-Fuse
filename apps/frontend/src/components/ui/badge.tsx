import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const baseStyles =
    'inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-medium border border-transparent';

  const appliedStyles = {
    default: 'bg-transparent/5 text-slate-100 border-white/10',
    secondary: 'bg-slate-800 text-slate-200 border-slate-700',
    destructive: 'bg-red-500/15 text-red-300 border-red-500/30',
    outline: 'border border-slate-600 text-slate-200 bg-transparent',
  };

  return <div className={`${baseStyles} ${appliedStyles[variant]} ${className}`}>{children}</div>;
}

export default Badge;
