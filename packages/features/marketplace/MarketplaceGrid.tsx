"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceGrid = void 0;
var react_1 = require("react");
var MarketplaceContext_1 = require("./MarketplaceContext");
var MarketplaceItem_1 = require("./MarketplaceItem");
var MarketplaceGrid = function () {
    var _a = (0, MarketplaceContext_1.useMarketplace)(), state = _a.state, selectItem = _a.selectItem, downloadItem = _a.downloadItem, purchaseItem = _a.purchaseItem;
    var items = state.items, loading = state.loading, error = state.error;
    if (loading) {
        return (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
        {__spreadArray([], Array(8), true).map(function (_, i) { return (<div key={i} className="animate-pulse bg-gray-200 rounded-lg h-96"/>); })}
      </div>);
    }
    if (error) {
        return (<div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            Error loading marketplace items
          </h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
      </div>);
    }
    if (items.length === 0) {
        return (<div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            No items found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters or search terms
          </p>
        </div>
      </div>);
    }
    return (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {items.map(function (item) { return (<MarketplaceItem_1.MarketplaceItem key={item.id} item={item} onSelect={selectItem} onDownload={function (item) { return downloadItem(item.id); }} onPurchase={function (item) { return purchaseItem(item.id); }}/>); })}
    </div>);
};
exports.MarketplaceGrid = MarketplaceGrid;
export {};
