import { FC } from 'react';
import { useMarketplace } from './MarketplaceContext';
import { MarketplaceItem } from './MarketplaceItem';

export const MarketplaceGrid: FC = () => {
  const { state, selectItem, downloadItem, purchaseItem } = useMarketplace();
  const { items, loading, error } = state;

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-64" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        <p>Error loading marketplace: {error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No items found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {items.map((item) => (
        <MarketplaceItem
          key={item.id}
          item={item}
          onSelect={selectItem}
          onDownload={downloadItem}
          onPurchase={purchaseItem}
        />
      ))}
    </div>
  );
};
