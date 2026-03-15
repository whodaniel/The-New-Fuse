import React from 'react';

export function Card({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-md border border-border/60 bg-card text-card-foreground ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-3 border-b border-border/60 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-base font-semibold ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-sm text-muted-foreground ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-3 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-3 border-t border-border/60 ${className}`} {...props}>
      {children}
    </div>
  );
}
