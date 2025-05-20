import React from 'react';
import { useSearch } from '@/hooks/useSearch';
import { SearchFilters } from './SearchFilters.js';
import { SearchResults } from './SearchResults.js';

export const GlobalSearch: React.FC = () => {
  const { query, filters, results, search } = useSearch();

  return (
    <div className="global-search">
      <SearchBar
        value={query}
        onChange={search}
        hotkey="cmd+k"
      />
      <SearchFilters
        filters={filters}
        onChange={setFilters}
      />
      <SearchResults results={results} />
    </div>
  );
};