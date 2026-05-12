import { Search } from 'lucide-react';
import React, { ReactNode, useMemo, useState } from 'react';
import { Resource } from '../../types/resources';
import { PremiumInput, PremiumSelect } from '../ui/premium';

// Filter configuration types
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

// Base browser props
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

// Filter matching function
function matchesSearch<T extends Resource>(
  item: T,
  searchTerm: string,
  searchFields: (keyof T)[]
): boolean {
  if (!searchTerm) return true;

  const lowerSearch = searchTerm.toLowerCase();

  return searchFields.some((field) => {
    const value = item[field];

    if (typeof value === 'string') {
      return value.toLowerCase().includes(lowerSearch);
    }

    if (Array.isArray(value)) {
      return value.some((v) => typeof v === 'string' && v.toLowerCase().includes(lowerSearch));
    }

    return false;
  });
}

function matchesFilters<T extends Resource>(item: T, filters: Record<string, string>): boolean {
  return Object.entries(filters).every(([key, value]) => {
    if (value === 'all') return true;

    const itemValue = item[key as keyof T];
    return itemValue === value;
  });
}

function sortItems<T extends Resource>(items: T[], sortBy: string): T[] {
  return [...items].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.downloads - a.downloads;
      case 'recent':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case 'rating':
        return b.rating - a.rating;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });
}

export function BaseBrowser<T extends Resource>({
  items,
  isLoading,
  renderCard,
  renderModal,
  filterFields,
  sortOptions,
  searchPlaceholder,
  emptyStateIcon,
  emptyStateMessage,
  searchFields = ['name', 'description', 'tags'] as (keyof T)[],
  onItemAction,
  defaultSort = 'popular',
}: BaseBrowserProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    filterFields.forEach((field) => {
      initial[field.key] = 'all';
    });
    return initial;
  });
  const [sortBy, setSortBy] = useState(defaultSort);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = items.filter(
      (item) => matchesSearch(item, searchTerm, searchFields) && matchesFilters(item, filters)
    );

    return sortItems(result, sortBy);
  }, [items, searchTerm, filters, sortBy, searchFields]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleAction = async (item: T, action: string) => {
    if (action === 'view-details') {
      setSelectedItem(item);
    } else if (onItemAction) {
      await onItemAction(item, action);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters Component will be injected here */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <PremiumInput
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
            iconPosition="left"
            className="w-full"
          />
        </div>

        <div className="flex gap-4 flex-wrap">
          {filterFields.map((field) => (
            <div key={field.key} className="min-w-[200px]">
              <PremiumSelect
                value={filters[field.key]}
                onChange={(e) => handleFilterChange(field.key, e.target.value)}
                options={[{ value: 'all', label: field.label }, ...field.options]}
              />
            </div>
          ))}

          <div className="min-w-[200px]">
            <PremiumSelect
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={sortOptions}
            />
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-400 mb-4 px-1">
        Showing <span className="text-white font-medium">{filteredItems.length}</span>{' '}
        {filteredItems.length === 1 ? 'result' : 'results'}
      </div>

      {/* Items Grid or Empty State */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item, index) => (
            <React.Fragment key={item.id}>{renderCard(item, index, handleAction)}</React.Fragment>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-transparent/5 rounded-md border border-white/10">
          <div className="text-6xl mb-4 opacity-50">{emptyStateIcon}</div>
          <h3 className="text-xl font-semibold text-white mb-2">{emptyStateMessage}</h3>
          <p className="text-gray-400">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Modal (if provided and item selected) */}
      {renderModal && selectedItem && renderModal(selectedItem, () => setSelectedItem(null))}
    </div>
  );
}
