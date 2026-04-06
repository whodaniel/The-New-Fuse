import { cn } from '@/lib/utils';
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  gradient?: boolean;
}

export default function Card({ children, className, gradient = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'relative rounded-3xl border border-white/10 bg-transparent/5 p-4 backdrop-blur-md transition-all duration-500 hover:border-white/20 hover:bg-transparent/10 group overflow-hidden',
        className
      )}
      {...props}
    >
      {gradient && (
        <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shine pointer-events-none" />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
