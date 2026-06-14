import { FC } from 'react';
interface SearchFilterBarProps {
    searchTerm: string;
    priority: string[];
    selectedTags: string[];
    availableTags: string[];
    onSearchChange: (term: string) => void;
    onPriorityChange: (priorities: string[]) => void;
    onTagsChange: (tags: string[]) => void;
}
export declare const SearchFilterBar: FC<SearchFilterBarProps>;
export {};
//# sourceMappingURL=SearchFilterBar.d.ts.map