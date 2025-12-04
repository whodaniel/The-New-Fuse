import React from 'react';
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    children: React.ReactNode;
}
export declare function Label({ children, ...props }: LabelProps): import("react/jsx-runtime").JSX.Element;
export {};
