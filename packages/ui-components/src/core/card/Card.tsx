import React from 'react';
import { cn } from '@/utils/cn';
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

const Card = ({
  className,
  title,
  children,
  footer,
  header,
  ...props
}: CardProps) => {
  return (
    <div
      className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    >
      {header && (
        <div className="flex flex-col space-y-1.5 p-6">
          {header}
        </div>
      )}
      {title && (
        <div className="px-6 py-4">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">
            {title}
          </h3>
        </div>
      )}
      <div className="p-6 pt-0">
        {children}
      </div>
      {footer && (
        <div className="flex items-center p-6 pt-0">
          {footer}
        </div>
      )}
    </div>
  );
};

Card.displayName = 'Card';

export { Card };