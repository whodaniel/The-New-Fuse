import { jsx as _jsx } from "react/jsx-runtime";
export function Badge(_a) {
    var children = _a.children, _b = _a.variant, variant = _b === void 0 ? 'default' : _b, _c = _a.className, className = _c === void 0 ? '' : _c;
    var baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
    var variantStyles = {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    };
    var appliedStyles = {
        default: 'bg-blue-500 text-white hover:bg-blue-600',
        secondary: 'bg-gray-500 text-white hover:bg-gray-600',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
        outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50',
    };
    return (_jsx("div", { className: "".concat(baseStyles, " ").concat(appliedStyles[variant], " ").concat(className), children: children }));
}
export default Badge;
