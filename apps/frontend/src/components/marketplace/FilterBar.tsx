Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterBar = void 0;
import react_1 from 'react';
import lucide_react_1 from 'lucide-react';
import Input_1 from '../ui/Input/Input.js';
import Select_1 from '../ui/Select/Select.js';
import Button_1 from '../ui/Button/Button.js';
const FilterBar = ({ categories, tags, onSearchChange, onCategoryChange, onTagChange, onSortChange, onPriceRangeChange, }) => {
    return (<div className="space-y-4">
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input_1.Input placeholder="Search marketplace..." onChange={(e) => onSearchChange(e.target.value)} icon={<lucide_react_1.Search className="h-4 w-4"/>}/>
        </div>
        <div className="w-full sm:w-48">
          <Select_1.Select onValueChange={onSortChange}>
            <Select_1.SelectTrigger>
              <Select_1.SelectValue placeholder="Sort by"/>
            </Select_1.SelectTrigger>
            <Select_1.SelectContent>
              <Select_1.SelectItem value="popular">Most Popular</Select_1.SelectItem>
              <Select_1.SelectItem value="recent">Recently Added</Select_1.SelectItem>
              <Select_1.SelectItem value="rating">Highest Rated</Select_1.SelectItem>
              <Select_1.SelectItem value="price-low">Price: Low to High</Select_1.SelectItem>
              <Select_1.SelectItem value="price-high">Price: High to Low</Select_1.SelectItem>
            </Select_1.SelectContent>
          </Select_1.Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        
        <div className="w-full sm:w-auto">
          <Select_1.Select onValueChange={onCategoryChange}>
            <Select_1.SelectTrigger className="w-full sm:w-48">
              <Select_1.SelectValue placeholder="Category"/>
            </Select_1.SelectTrigger>
            <Select_1.SelectContent>
              {categories.map((category) => (<Select_1.SelectItem key={category} value={category}>
                  {category}
                </Select_1.SelectItem>))}
            </Select_1.SelectContent>
          </Select_1.Select>
        </div>

        <div className="w-full sm:w-auto">
          <Select_1.Select onValueChange={onTagChange}>
            <Select_1.SelectTrigger className="w-full sm:w-48">
              <Select_1.SelectValue placeholder="Tags"/>
            </Select_1.SelectTrigger>
            <Select_1.SelectContent>
              {tags.map((tag) => (<Select_1.SelectItem key={tag} value={tag}>
                  {tag}
                </Select_1.SelectItem>))}
            </Select_1.SelectContent>
          </Select_1.Select>
        </div>

        <div className="w-full sm:w-auto">
          <Select_1.Select onValueChange={(value) => {
            const ranges = {
                'all': [0, Infinity],
                'free': [0, 0],
                'paid': [0.01, Infinity],
                'under-10': [0, 10],
                'under-50': [0, 50],
                'over-50': [50, Infinity],
            };
            onPriceRangeChange(ranges[value]);
        }}>
            <Select_1.SelectTrigger className="w-full sm:w-48">
              <Select_1.SelectValue placeholder="Price Range"/>
            </Select_1.SelectTrigger>
            <Select_1.SelectContent>
              <Select_1.SelectItem value="all">All Prices</Select_1.SelectItem>
              <Select_1.SelectItem value="free">Free</Select_1.SelectItem>
              <Select_1.SelectItem value="paid">Paid</Select_1.SelectItem>
              <Select_1.SelectItem value="under-10">Under $10</Select_1.SelectItem>
              <Select_1.SelectItem value="under-50">Under $50</Select_1.SelectItem>
              <Select_1.SelectItem value="over-50">$50+</Select_1.SelectItem>
            </Select_1.SelectContent>
          </Select_1.Select>
        </div>

        <Button_1.Button variant="outline" className="w-full sm:w-auto" icon={<lucide_react_1.SlidersHorizontal className="h-4 w-4"/>}>
          More Filters
        </Button_1.Button>
      </div>
    </div>);
};
exports.FilterBar = FilterBar;
export {};
//# sourceMappingURL=FilterBar.js.map