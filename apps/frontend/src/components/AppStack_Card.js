import { jsx as _jsx } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppStack_CardContent = exports.AppStack_CardDescription = exports.AppStack_CardTitle = exports.AppStack_CardHeader = exports.AppStack_Card = void 0;
var AppStack_Card = function (_a) {
    var children = _a.children, _b = _a.variant, variant = _b === void 0 ? 'default' : _b, _c = _a.className, className = _c === void 0 ? '' : _c;
    var baseStyles = "rounded-xl transition-all duration-200";
    var variantStyles = {
        default: "bg-white border shadow-lg hover:shadow-xl",
        gradient: "bg-gradient-to-br from-white to-gray-50 border border-gray-100 shadow-xl hover:shadow-2xl",
        hover: "bg-white border hover:border-blue-500 shadow-lg hover:shadow-xl hover:scale-[1.02]"
    };
    return (_jsx("div", { className: "".concat(baseStyles, " ").concat(variantStyles[variant], " ").concat(className, " p-6"), children: children }));
};
exports.AppStack_Card = AppStack_Card;
var AppStack_CardHeader = function (_a) {
    var children = _a.children, _b = _a.className, className = _b === void 0 ? '' : _b;
    return _jsx("div", { className: "space-y-1.5 mb-4 ".concat(className), children: children });
};
exports.AppStack_CardHeader = AppStack_CardHeader;
var AppStack_CardTitle = function (_a) {
    var children = _a.children, _b = _a.className, className = _b === void 0 ? '' : _b;
    return (_jsx("h3", { className: "text-2xl font-semibold tracking-tight text-gray-900 ".concat(className), children: children }));
};
exports.AppStack_CardTitle = AppStack_CardTitle;
var AppStack_CardDescription = function (_a) {
    var children = _a.children, _b = _a.className, className = _b === void 0 ? '' : _b;
    return (_jsx("p", { className: "text-sm text-gray-500 ".concat(className), children: children }));
};
exports.AppStack_CardDescription = AppStack_CardDescription;
var AppStack_CardContent = function (_a) {
    var children = _a.children, _b = _a.className, className = _b === void 0 ? '' : _b;
    return _jsx("div", { className: className, children: children });
};
exports.AppStack_CardContent = AppStack_CardContent;
