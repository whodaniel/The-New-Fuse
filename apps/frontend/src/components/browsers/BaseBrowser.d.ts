import { ReactNode } from 'react';
import { Resource } from '../../types/resources';
export interface FilterOption {
    value: string;
    label: string;
}
export interface FilterField {
    key: string;
    label: string;
    options: FilterOption[];
}
export interface SortOption {
    value: string;
    label: string;
}
export interface BaseBrowserProps<T extends Resource> {
    items: T[];
    isLoading: boolean;
    renderCard: (item: T, index: number, onAction: (item: T, action: string) => void) => ReactNode;
    renderModal?: (item: T | null, onClose: () => void) => ReactNode;
    filterFields: FilterField[];
    sortOptions: SortOption[];
    searchPlaceholder: string;
    emptyStateIcon: string;
    emptyStateMessage: string;
    searchFields?: (keyof T)[];
    onItemAction?: (item: T, action: string) => Promise<void>;
    defaultSort?: string;
}
export declare function BaseBrowser<T extends Resource>({ items, isLoading, renderCard, renderModal, filterFields, sortOptions, searchPlaceholder, emptyStateIcon, emptyStateMessage, searchFields, onItemAction, defaultSort, }: BaseBrowserProps<T>): import("react/jsx-runtime").JSX.Element;
