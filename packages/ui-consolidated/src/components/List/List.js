import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef } from 'react';
export const List = forwardRef(({ children, className = '', ...props }, ref) => {
    return (_jsx("ul", { className: `list-none p-0 m-0 ${className}`, ref: ref, ...props, children: children }));
});
List.displayName = 'List';
export const ListItem = forwardRef(({ children, className = '', ...props }, ref) => {
    return (_jsx("li", { className: `py-2 ${className}`, ref: ref, ...props, children: children }));
});
ListItem.displayName = 'ListItem';
