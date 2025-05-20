"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.preloaderVariants = exports.FullScreenLoader = exports.Preloader = void 0;
import jsx_runtime_1 from 'react/jsx-runtime';
const react_1 = __importDefault(require("react"));
import class_variance_authority_1 from 'class-variance-authority';
const preloaderVariants = (0, class_variance_authority_1.cva)('animate-spin rounded-full border-current border-t-transparent', {
    variants: {
        size: {
            xs: 'h-3 w-3 border',
            sm: 'h-4 w-4 border-2',
            md: 'h-6 w-6 border-2',
            lg: 'h-8 w-8 border-[3px]',
            xl: 'h-12 w-12 border-4',
        },
        variant: {
            default: 'text-primary',
            light: 'text-white',
            dark: 'text-gray-900',
            muted: 'text-gray-400',
        }
    },
    defaultVariants: {
        size: 'md',
        variant: 'default',
    }
});
exports.preloaderVariants = preloaderVariants;
const Preloader = react_1.default.forwardRef(({ className, size, variant, center, ...props }, ref) => {
    return ((0, jsx_runtime_1.jsxs)("div", { ref: ref, role: "status", className: center ? 'flex items-center justify-center' : undefined, ...props, children: [(0, jsx_runtime_1.jsx)("div", { className: preloaderVariants({ size, variant, className }) }), (0, jsx_runtime_1.jsx)("span", { className: "sr-only", children: "Loading..." })] }));
});
exports.Preloader = Preloader;
Preloader.displayName = 'Preloader';
const FullScreenLoader = react_1.default.forwardRef((props, ref) => {
    return ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm", children: (0, jsx_runtime_1.jsx)(Preloader, { ref: ref, size: "xl", center: true, ...props }) }));
});
exports.FullScreenLoader = FullScreenLoader;
FullScreenLoader.displayName = 'FullScreenLoader';
//# sourceMappingURL=index.js.map