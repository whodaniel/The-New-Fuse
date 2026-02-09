export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  type: agent' | 'workflow' | 'template';
  category: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  rating: number;
  reviews: number;
  price: number;
  tags: string[];
  thumbnail?: string;
  downloads: number;
  createdAt: Date;
  updatedAt: Date;
  version: string;
  compatibility: string[];
}

export interface MarketplaceFilter {
  search?: string;
  type?: MarketplaceItem['type'];
  category?: string;
  tags?: string[];
  priceRange?: [number, number];
  rating?: number;
  sortBy?: popular' | 'recent' | 'rating' | 'price';
  sortOrder?: asc' | 'desc';
}

export interface MarketplaceState {
  items: MarketplaceItem[];
  filter: MarketplaceFilter;
  loading: boolean;
  error?: string;
  selectedItem?: MarketplaceItem;
}

export interface MarketplaceContextType {
  state: MarketplaceState;
  setFilter: (filter: Partial<MarketplaceFilter>) => void;
  selectItem: (item?: MarketplaceItem) => void;
  downloadItem: (itemId: string) => Promise<void>;
  purchaseItem: (itemId: string) => Promise<void>;
}
