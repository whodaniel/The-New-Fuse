export interface MarketplaceItem {
    id: string;
    name: string;
    description?: string;
    version: string;
    author: string;
    price?: number;
}
export interface MarketplaceFilter {
    category?: string;
    priceRange?: [number, number];
    rating?: number;
}
//# sourceMappingURL=marketplace.d.ts.map