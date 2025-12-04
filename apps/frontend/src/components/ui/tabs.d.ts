import React from 'react';
export interface TabsProps {
    value: string;
    onValueChange?: (value: string) => void;
    children: React.ReactNode;
    className?: string;
}
export declare const Tabs: React.FC<TabsProps>;
export interface TabsListProps {
    children: React.ReactNode;
    className?: string;
}
export declare const TabsList: React.FC<TabsListProps>;
export interface TabsTriggerProps {
    value: string;
    children: React.ReactNode;
    className?: string;
}
export declare const TabsTrigger: React.FC<TabsTriggerProps>;
export interface TabsContentProps {
    value: string;
    children: React.ReactNode;
    className?: string;
}
export declare const TabsContent: React.FC<TabsContentProps>;
