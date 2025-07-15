import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Download } from 'lucide-react';
import { api } from '@/lib/api';
import logger from 'your-logger-library';

const marketItemSchema = z.object({
  id: z.string(),
  name: z.string().min(3),
  description: z.string().min(10),
  type: z.enum(['agent', 'workflow', 'plugin']),
  price: z.number().min(0),
  author: z.object({
    id: z.string(),
    name: z.string(),
    avatar: z.string().optional(),
  }),
  rating: z.number().min(0).max(5),
  downloads: z.number().min(0),
  tags: z.array(z.string()),
  version: z.string(),
  compatibility: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

type MarketItem = z.infer<typeof marketItemSchema>;

interface FilterState {
  type: string[];
  priceRange: [number, number];
  rating: number;
  compatibility: string[];
  sortBy: 'popular' | 'recent' | 'rating' | 'price';
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange }) => {
  const handleTypeChange = (type: string) => {
    const newTypes = filters.type.includes(type)
      ? filters.type.filter(t => t !== type)
      : [...filters.type, type];
    onFilterChange({ ...filters, type: newTypes });
  };

  const handlePriceChange = (range: [number, number]) => {
    onFilterChange({ ...filters, priceRange: range });
  };

  const handleRatingChange = (rating: number) => {
    onFilterChange({ ...filters, rating });
  };

  const handleSortChange = (sortBy: FilterState['sortBy']) => {
    onFilterChange({ ...filters, sortBy });
  };

  return (
    <div className="space-y-6 p-4 bg-card rounded-lg">
      <div>
        <h3 className="text-lg font-semibold mb-2">Type</h3>
        <div className="space-y-2">
          {['agent', 'workflow', 'plugin'].map(type => (
            <label key={type} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.type.includes(type)}
                onChange={() => handleTypeChange(type)}
                className="rounded border-gray-300"
              />
              <span className="capitalize">{type}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Price Range</h3>
        <div className="flex items-center space-x-4">
          <input
            type="number"
            value={filters.priceRange[0]}
            onChange={(e) => handlePriceChange([+e.target.value, filters.priceRange[1]])}
            className="w-24 rounded-md border p-1"
            aria-label="Minimum price"
            placeholder="Min"
          />
          <span>to</span>
          <input
            type="number"
            value={filters.priceRange[1]}
            onChange={(e) => handlePriceChange([filters.priceRange[0], +e.target.value])}
            className="w-24 rounded-md border p-1"
            aria-label="Maximum price"
            placeholder="Max"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Minimum Rating</h3>
        <input
          type="range"
          min="0"
          max="5"
          step="0.5"
          value={filters.rating}
          onChange={(e) => handleRatingChange(+e.target.value)}
          className="w-full"
          aria-label="Minimum rating"
        />
        <div className="text-sm text-muted-foreground mt-1">
          {filters.rating} stars and up
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Sort By</h3>
        <select
          value={filters.sortBy}
          onChange={(e) => handleSortChange(e.target.value as FilterState['sortBy'])}
          className="w-full rounded-md border p-2"
          aria-label="Sort by"
        >
          <option value="popular">Most Popular</option>
          <option value="recent">Most Recent</option>
          <option value="rating">Highest Rated</option>
          <option value="price">Lowest Price</option>
        </select>
      </div>
    </div>
  );
};

interface MarketItemCardProps {
  item: MarketItem;
  onInstall: (itemId: string) => void;
}

const MarketItemCard: React.FC<MarketItemCardProps> = ({ item, onInstall }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{item.name}</CardTitle>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm text-muted-foreground">by {item.author.name}</span>
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-sm ml-1">{item.rating}</span>
              </div>
              <div className="flex items-center">
                <Download className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm ml-1">{item.downloads}</span>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="capitalize">
            {item.type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {item.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">${item.price}</span>
          <Button onClick={() => onInstall(item.id)}>Install</Button>
        </div>

        <div className="mt-2 text-xs text-muted-foreground">
          Version {item.version} • Compatible with: {item.compatibility.join(', ')}
        </div>
      </CardContent>
    </Card>
  );
};

export const MarketplaceModule: React.FC = () => {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    type: [],
    priceRange: [0, 1000],
    rating: 0,
    compatibility: [],
    sortBy: 'popular',
  });

  useEffect(() => {
    fetchMarketplaceItems();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [items, filters]);

  const fetchMarketplaceItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/marketplace/items');
      const validatedItems = response.data.map((item: any) => marketItemSchema.parse(item));
      setItems(validatedItems);
    } catch (error) {
      logger.error('Failed to fetch marketplace items:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...items];

    // Filter by type
    if (filters.type.length > 0) {
      filtered = filtered.filter(item => filters.type.includes(item.type));
    }

    // Filter by price range
    filtered = filtered.filter(
      item => item.price >= filters.priceRange[0] && item.price <= filters.priceRange[1]
    );

    // Filter by rating
    filtered = filtered.filter(item => item.rating >= filters.rating);

    // Sort items
    switch (filters.sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'recent':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'price':
        filtered.sort((a, b) => a.price - b.price);
        break;
    }

    setFilteredItems(filtered);
  };

  const handleInstall = async (itemId: string) => {
    try {
      await api.post(`/marketplace/items/${itemId}/install`);
      // Refresh the items to update download counts
      fetchMarketplaceItems();
    } catch (error) {
      logger.error('Failed to install item:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Marketplace</h1>
        <p className="text-muted-foreground">Discover and install agents, workflows, and plugins</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <FilterBar filters={filters} onFilterChange={setFilters} />
        </div>

        <div className="lg:col-span-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No items found matching your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredItems.map(item => (
                <MarketItemCard key={item.id} item={item} onInstall={handleInstall} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
