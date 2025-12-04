import React from 'react';
interface SearchBarProps {
    onSearch: (term: string) => void;
    placeholder?: string;
}
export declare const SearchBar: React.FC<SearchBarProps>;
export {};
