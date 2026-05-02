import React, { forwardRef } from 'react';

export interface ListProps {
  children?: React.ReactNode;
  className?: string;
}

export const List = forwardRef<HTMLUListElement, ListProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <ul 
        className={`list-none p-0 m-0 ${className}`} 
        ref={ref} 
        {...props}
      >
        {children}
      </ul>
    );
  }
);

List.displayName = 'List';

export interface ListItemProps {
  children?: React.ReactNode;
  className?: string;
}

export const ListItem = forwardRef<HTMLLIElement, ListItemProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <li 
        className={`py-2 ${className}`} 
        ref={ref} 
        {...props}
      >
        {children}
      </li>
    );
  }
);

ListItem.displayName = 'ListItem';