'use client';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import React, { useCallback, useState } from 'react';

interface AgentSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export const AgentSearch: React.FC<AgentSearchProps> = ({
  onSearch,
  placeholder = 'Search agents...',
  debounceMs = 300,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const debouncedSearch = useCallback(
    (query: string) => {
      const timeoutId = setTimeout(() => {
        onSearch(query);
      }, debounceMs);
      return () => clearTimeout(timeoutId);
    },
    [onSearch, debounceMs]
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={handleSearch}
        className="pl-10 w-full"
      />
    </div>
  );
};
