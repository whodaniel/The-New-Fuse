import { FilterField, SortOption } from './BaseBrowser';
export interface BrowserFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder: string;
    filters: Record<string, string>;
    onFilterChange: (key: string, value: string) => void;
    filterFields: FilterField[];
    sortBy: string;
    onSortChange: (value: string) => void;
    sortOptions: SortOption[];
}
export declare function BrowserFilters({ searchTerm, onSearchChange, searchPlaceholder, filters, onFilterChange, filterFields, sortBy, onSortChange, sortOptions, }: BrowserFiltersProps): import("react/jsx-runtime").JSX.Element;
