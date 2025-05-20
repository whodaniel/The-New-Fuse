Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceGrid = void 0;
import react_1 from 'react';
import MarketplaceCard_1 from './MarketplaceCard.js';
import FilterBar_1 from './FilterBar.js';
import useToast_1 from '@/hooks/useToast';
const MarketplaceGrid = ({ initialItems, categories, tags, }) => {
    const [items, setItems] = (0, react_1.useState)(initialItems);
    const [filteredItems, setFilteredItems] = (0, react_1.useState)(initialItems);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [selectedCategory, setSelectedCategory] = (0, react_1.useState)('');
    const [selectedTag, setSelectedTag] = (0, react_1.useState)('');
    const [priceRange, setPriceRange] = (0, react_1.useState)([0, Infinity]);
    const [sortBy, setSortBy] = (0, react_1.useState)('popular');
    const { toast } = (0, useToast_1.useToast)();
    (0, react_1.useEffect)(() => {
        let result = [...items];
        if (searchQuery) {
            result = result.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        if (selectedCategory) {
            result = result.filter((item) => item.category === selectedCategory);
        }
        if (selectedTag) {
            result = result.filter((item) => item.tags.includes(selectedTag));
        }
        result = result.filter((item) => item.price >= priceRange[0] && item.price <= priceRange[1]);
        result.sort((a, b) => {
            switch (sortBy) {
                case 'popular':
                    return b.downloads - a.downloads;
                case 'recent':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'rating':
                    return b.rating - a.rating;
                case 'price-low':
                    return a.price - b.price;
                case 'price-high':
                    return b.price - a.price;
                default:
                    return 0;
            }
        });
        setFilteredItems(result);
    }, [items, searchQuery, selectedCategory, selectedTag, priceRange, sortBy]);
    const handlePurchase = async (item) => {
        try {
            toast({
                title: 'Success',
                description: `Successfully purchased ${item.name}`,
                variant: 'success',
            });
        }
        catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to complete purchase',
                variant: 'error',
            });
        }
    };
    const handlePreview = (item) => {
    };
    return (<div className="space-y-6">
      
      <FilterBar_1.FilterBar categories={categories} tags={tags} onSearchChange={setSearchQuery} onCategoryChange={setSelectedCategory} onTagChange={setSelectedTag} onSortChange={setSortBy} onPriceRangeChange={setPriceRange}/>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (<MarketplaceCard_1.MarketplaceCard key={item.id} item={item} onPurchase={handlePurchase} onPreview={handlePreview}/>))}
      </div>

      {filteredItems.length === 0 && (<div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            No items found
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your search or filter criteria
          </p>
        </div>)}
    </div>);
};
exports.MarketplaceGrid = MarketplaceGrid;
export {};
//# sourceMappingURL=MarketplaceGrid.js.map