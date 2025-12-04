import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TextQuote, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
var TextSizeMenu = function (_a) {
    var _b = _a.fontSize, fontSize = _b === void 0 ? 14 : _b, onFontSizeChange = _a.onFontSizeChange, className = _a.className;
    var sizes = [12, 14, 16, 18, 20];
    var increaseSize = function () {
        var currentIndex = sizes.indexOf(fontSize);
        if (currentIndex < sizes.length - 1 && onFontSizeChange) {
            onFontSizeChange(sizes[currentIndex + 1]);
        }
    };
    var decreaseSize = function () {
        var currentIndex = sizes.indexOf(fontSize);
        if (currentIndex > 0 && onFontSizeChange) {
            onFontSizeChange(sizes[currentIndex - 1]);
        }
    };
    return (_jsxs("div", { className: cn("flex items-center gap-1", className), children: [_jsx("button", { onClick: decreaseSize, className: "p-1.5 hover:bg-slate-100 rounded transition-colors", disabled: fontSize <= sizes[0], children: _jsx(Minus, { className: "w-3 h-3" }) }), _jsxs("div", { className: "flex items-center gap-1 px-2 text-sm", children: [_jsx(TextQuote, { className: "w-3 h-3" }), _jsxs("span", { children: [fontSize, "px"] })] }), _jsx("button", { onClick: increaseSize, className: "p-1.5 hover:bg-slate-100 rounded transition-colors", disabled: fontSize >= sizes[sizes.length - 1], children: _jsx(Plus, { className: "w-3 h-3" }) })] }));
};
export default TextSizeMenu;
