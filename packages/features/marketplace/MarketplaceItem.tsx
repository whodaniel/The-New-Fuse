import { FC } from 'react';
import { MarketplaceItem as MarketplaceItemType } from './types';

interface MarketplaceItemProps {
  item: MarketplaceItemType;
  onSelect?: (item: MarketplaceItemType) => void;
  onDownload?: (itemId: string) => void;
  onPurchase?: (itemId: string) => void;
}

export const MarketplaceItem: FC<MarketplaceItemProps> = ({
  item,
  onSelect,
  onDownload,
  onPurchase,
}) => {
  const renderRating = () => (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= item.rating ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      ))}
      <span className="ml-1 text-sm text-gray-600">({item.reviews})</span>
    </div>
  );

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect?.(item)}
    >
      {item.thumbnail && (
        <img src={item.thumbnail} alt={item.title} className="w-full h-40 object-cover" />
      )}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900">{item.title}</h3>
          <span className="text-sm font-bold text-gray-900">
            {item.price === 0 ? 'Free' : `$${item.price}`}
          </span>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2 mb-4">{item.description}</p>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center">{renderRating()}</div>
          <div className="flex space-x-2">
            {item.price > 0 ? (
              <button
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onPurchase?.(item.id);
                }}
              >
                Buy
              </button>
            ) : (
              <button
                className="px-3 py-1 border border-gray-300 text-sm rounded-md hover:bg-gray-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload?.(item.id);
                }}
              >
                Get
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
