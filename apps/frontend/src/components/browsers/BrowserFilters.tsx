import React from 'react';
import { FiSearch } from 'react-icons/fi';
import { Input } from '../ui/input';
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

export function BrowserFilters({
  searchTerm,
  onSearchChange,
  searchPlaceholder,
  filters,
  onFilterChange,
  filterFields,
  sortBy,
  onSortChange,
  sortOptions,
}: BrowserFiltersProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Search Input */}
      <div className="flex-1 relative">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Dropdowns */}
      {filterFields.map(field => (
        <select
          key={field.key}
          value={filters[field.key]}
          onChange={(e) => onFilterChange(field.key, e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">{field.label}</option>
          {field.options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}

      {/* Sort Dropdown */}
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {sortOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
