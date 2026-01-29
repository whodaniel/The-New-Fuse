import React, { FC } from 'react';
import { useMarketplace } from './MarketplaceContext';
import { MarketplaceItem } from './types';

const itemTypes: MarketplaceItem['type'][] = ['agent', 'workflow', 'template'];

const sortOptions = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'recent', label: 'Most Recent' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price', label: 'Price' },
];

export const MarketplaceFilters: FC = () => {
  const { state, setFilter } = useMarketplace();
  const { filter } = state;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter({ search: e.target.value });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter({ type: (e.target.value as any) || undefined });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [sortBy, sortOrder] = e.target.value.split('-') as [any, any];
    setFilter({ sortBy, sortOrder });
  };

  const handleRatingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    setFilter({ rating: value || undefined });
  };

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg shadow-sm">
      <div>
        <input
          type="text"
          placeholder="Search marketplace..."
          className="w-full rounded-md border border-gray-300 px-3 py-2"
          value={filter.search || ''}
          onChange={handleSearchChange}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select
          value={filter.type || ''}
          onChange={handleTypeChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">All Types</option>
          {itemTypes.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}s
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Rating</label>
        <select
          value={filter.rating || ''}
          onChange={handleRatingChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">Any Rating</option>
          {[4, 3, 2, 1].map((rating) => (
            <option key={rating} value={rating}>
              {rating}+ Stars
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
        <select
          value={`${filter.sortBy || 'popular'}-${filter.sortOrder || 'desc'}`}
          onChange={handleSortChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2"
        >
          {sortOptions.map((option) => (
            <React.Fragment key={option.value}>
              <option value={`${option.value}-desc`}>{option.label} (High to Low)</option>
              <option value={`${option.value}-asc`}>{option.label} (Low to High)</option>
            </React.Fragment>
          ))}
        </select>
      </div>
    </div>
  );
};
