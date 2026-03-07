"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceItem = void 0;
var react_1 = require("react");
var Card_1 = require("../../core/components/ui/Card");
var Button_1 = require("../../core/components/ui/Button");
var MarketplaceItem = function (_a) {
    var item = _a.item, onSelect = _a.onSelect, onDownload = _a.onDownload, onPurchase = _a.onPurchase;
    var renderRating = function () {
        return (<div className="flex items-center">
        {[1, 2, 3, 4, 5].map(function (star) { return (<svg key={star} className={"w-4 h-4 ".concat(star <= item.rating ? 'text-yellow-400' : text-gray-300')} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 15.585l-6.327 3.89 1.42-7.897L.18 6.974l7.924-1.092L10 0l1.896 5.882 7.924 1.092-4.913 4.604 1.42 7.897z" clipRule="evenodd"/>
          </svg>); })}
        <span className="ml-1 text-sm text-gray-600">
          ({item.reviews} reviews)
        </span>
      </div>);
    };
    var formatPrice = function (price) {
        return price === 0
            ? 'Free'
            : new Intl.NumberFormat('en-US', {
                style: currency',
                currency: USD',
            }).format(price);
    };
    return (<Card_1.Card className="h-full transition-shadow hover:shadow-md cursor-pointer" onClick={function () { return onSelect === null || onSelect === void 0 ? void 0 : onSelect(item); }}>
      {/* Thumbnail */}
      {item.thumbnail && (<div className="relative pb-[56.25%]">
          <img src={item.thumbnail} alt={item.title} className="absolute inset-0 w-full h-full object-cover rounded-t-lg"/>
        </div>)}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {item.description}
            </p>
          </div>
          <span className="text-lg font-medium text-gray-900">
            {formatPrice(item.price)}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center">
            {item.author.avatar ? (<img src={item.author.avatar} alt={item.author.name} className="w-6 h-6 rounded-full"/>) : (<div className="w-6 h-6 rounded-full bg-gray-200"/>)}
            <span className="ml-2 text-sm text-gray-600">
              {item.author.name}
            </span>
          </div>
          {renderRating()}
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap gap-1">
            {item.tags.map(function (tag) { return (<span key={tag} className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
                {tag}
              </span>); })}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <span className="mr-3">
              {item.downloads.toLocaleString()} downloads
            </span>
            <span>v{item.version}</span>
          </div>
          <div className="flex space-x-2">
            {item.price > 0 ? (<Button_1.Button variant="primary" onClick={function (e) {
                e.stopPropagation();
                onPurchase === null || onPurchase === void 0 ? void 0 : onPurchase(item);
            }}>
                Purchase
              </Button_1.Button>) : (<Button_1.Button variant="outline" onClick={function (e) {
                e.stopPropagation();
                onDownload === null || onDownload === void 0 ? void 0 : onDownload(item);
            }}>
                Download
              </Button_1.Button>)}
          </div>
        </div>
      </div>
    </Card_1.Card>);
};
exports.MarketplaceItem = MarketplaceItem;
export {};
