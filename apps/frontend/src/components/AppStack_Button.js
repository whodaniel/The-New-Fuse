var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.AppStack_Button = void 0;
var react_1 = __importDefault(require("react"));
var AppStack_Button = function (_a) {
    var onClick = _a.onClick, _b = _a.variant, variant = _b === void 0 ? 'default' : _b, children = _a.children, disabled = _a.disabled, _c = _a.className, className = _c === void 0 ? '' : _c;
    var baseStyles = "p-2 rounded transition-all duration-200";
    var variantStyles = variant === 'destructive'
        ? 'bg-red-500 hover:bg-red-600 text-white'
        : 'bg-blue-500 hover:bg-blue-600 text-white';
    return (react_1.default.createElement("button", { onClick: onClick, className: "".concat(baseStyles, " ").concat(variantStyles, " ").concat(className), disabled: disabled }, children));
};
exports.AppStack_Button = AppStack_Button;
export {};
