import { jsx as _jsx } from "react/jsx-runtime";
export function Loading() {
    return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary" }) }));
}
