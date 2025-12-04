var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
var ErrorBoundary = /** @class */ (function (_super) {
    __extends(ErrorBoundary, _super);
    function ErrorBoundary(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            hasError: false,
            error: null,
        };
        return _this;
    }
    ErrorBoundary.getDerivedStateFromError = function (error) {
        return { hasError: true, error: error };
    };
    ErrorBoundary.prototype.componentDidCatch = function (error, errorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    };
    ErrorBoundary.prototype.render = function () {
        var _a;
        if (this.state.hasError) {
            return (_jsxs("div", { className: "flex flex-col items-center justify-center min-h-screen p-4 text-center", children: [_jsx("h1", { className: "text-4xl font-bold text-destructive mb-4", children: "Oops! Something went wrong" }), _jsx("p", { className: "text-lg text-muted-foreground mb-8", children: ((_a = this.state.error) === null || _a === void 0 ? void 0 : _a.message) || 'An unexpected error occurred' }), _jsx("button", { className: "bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md", onClick: function () { return window.location.reload(); }, children: "Reload Page" })] }));
        }
        return this.props.children;
    };
    return ErrorBoundary;
}(Component));
export default ErrorBoundary;
