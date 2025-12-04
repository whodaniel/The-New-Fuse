import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceCard = void 0;
import lucide_react_1 from 'lucide-react';
import Card_1 from '../ui/Card/Card';
import Button_1 from '../ui/Button/Button';
var MarketplaceCard = function (_a) {
    var item = _a.item, onPurchase = _a.onPurchase, onPreview = _a.onPreview;
    var formatPrice = function (price) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(price);
    };
    return (_jsxs(Card_1.Card, { className: "hover:shadow-lg transition-shadow duration-200", children: [_jsx(Card_1.CardHeader, { children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx(Card_1.CardTitle, { children: item.name }), _jsx(Card_1.CardDescription, { children: item.description })] }), _jsxs("div", { className: "flex items-center space-x-1 text-yellow-500", children: [_jsx(lucide_react_1.Star, { className: "h-4 w-4 fill-current" }), _jsx("span", { className: "text-sm font-medium", children: item.rating.toFixed(1) })] })] }) }), _jsx(Card_1.CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "flex flex-wrap gap-2", children: item.tags.map(function (tag) { return (_jsxs("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", children: [_jsx(lucide_react_1.Tag, { className: "w-3 h-3 mr-1" }), tag] }, tag)); }) }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg", children: [_jsx("div", { className: "text-sm text-gray-500 dark:text-gray-400", children: "Downloads" }), _jsxs("div", { className: "mt-1 font-semibold flex items-center justify-center", children: [_jsx(lucide_react_1.Download, { className: "w-4 h-4 mr-1" }), item.downloads.toLocaleString()] })] }), _jsxs("div", { className: "text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg", children: [_jsx("div", { className: "text-sm text-gray-500 dark:text-gray-400", children: "Price" }), _jsx("div", { className: "mt-1 font-semibold", children: formatPrice(item.price) })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center", children: _jsx("span", { className: "text-sm font-medium", children: item.author.name.charAt(0) }) }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium", children: item.author.name }), _jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: "Author" })] })] })] }) }), _jsxs(Card_1.CardFooter, { className: "flex justify-between", children: [_jsx(Button_1.Button, { variant: "outline", size: "sm", onClick: function () { return onPreview(item); }, children: "Preview" }), _jsx(Button_1.Button, { size: "sm", onClick: function () { return onPurchase(item); }, children: item.price === 0 ? 'Install' : "Buy ".concat(formatPrice(item.price)) })] })] }));
};
exports.MarketplaceCard = MarketplaceCard;
