import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
export function Dialog(_a) {
    var open = _a.open, onOpenChange = _a.onOpenChange, children = _a.children;
    if (!open)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center", children: [_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50", onClick: function () { return onOpenChange === null || onOpenChange === void 0 ? void 0 : onOpenChange(false); } }), _jsx("div", { className: "relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4", children: children })] }));
}
export function DialogContent(_a) {
    var _b = _a.className, className = _b === void 0 ? "" : _b, children = _a.children;
    return (_jsx("div", { className: "p-6 ".concat(className), children: children }));
}
export function DialogHeader(_a) {
    var children = _a.children;
    return (_jsx("div", { className: "mb-4", children: children }));
}
export function DialogTitle(_a) {
    var children = _a.children;
    return (_jsx("h2", { className: "text-lg font-semibold text-gray-900", children: children }));
}
export function DialogDescription(_a) {
    var children = _a.children;
    return (_jsx("p", { className: "text-sm text-gray-600 mt-2", children: children }));
}
export function DialogFooter(_a) {
    var children = _a.children;
    return (_jsx("div", { className: "flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-200", children: children }));
}
export function DialogTrigger(_a) {
    var asChild = _a.asChild, children = _a.children;
    return _jsx(_Fragment, { children: children });
}
export function DialogClose(_a) {
    var asChild = _a.asChild, children = _a.children;
    return _jsx(_Fragment, { children: children });
}
export default Dialog;
// Named exports for compound component pattern
export var Root = Dialog;
export var Content = DialogContent;
export var Header = DialogHeader;
export var Title = DialogTitle;
export var Description = DialogDescription;
export var Footer = DialogFooter;
export var Trigger = DialogTrigger;
export var Close = DialogClose;
