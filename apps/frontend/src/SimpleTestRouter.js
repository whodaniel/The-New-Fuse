import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Link, BrowserRouter } from 'react-router-dom';
// Simple test component
function SimpleHome() {
    return (_jsxs("div", { className: "p-8 max-w-4xl mx-auto", children: [_jsx("h1", { className: "text-3xl font-bold mb-6", children: "\uD83D\uDE80 The New Fuse - Test Mode" }), _jsxs("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg", children: [_jsx("p", { className: "text-lg mb-4", children: "This is a simplified test version." }), _jsx("p", { className: "text-gray-600 mb-4", children: "If you see this, the basic routing is working." }), _jsxs("div", { className: "space-y-2", children: [_jsx(Link, { to: "/test-page", className: "block text-blue-600 hover:text-blue-800", children: "\u2192 Test Page" }), _jsx(Link, { to: "/comprehensive", className: "block text-blue-600 hover:text-blue-800", children: "\u2192 Back to Comprehensive Router" })] })] })] }));
}
function TestPage() {
    return (_jsxs("div", { className: "p-8 max-w-4xl mx-auto", children: [_jsx("h1", { className: "text-3xl font-bold mb-6", children: "\u2705 Test Page" }), _jsxs("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg", children: [_jsx("p", { className: "text-lg mb-4", children: "Test page is working!" }), _jsx(Link, { to: "/", className: "text-blue-600 hover:text-blue-800", children: "\u2190 Back to Home" })] })] }));
}
export default function SimpleTestRouter() {
    return (_jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(SimpleHome, {}) }), _jsx(Route, { path: "/test-page", element: _jsx(TestPage, {}) }), _jsx(Route, { path: "*", element: _jsxs("div", { className: "p-8 text-center", children: [_jsx("h1", { className: "text-3xl font-bold text-red-600 mb-4", children: "404 - Page Not Found" }), _jsx(Link, { to: "/", className: "text-blue-600 hover:text-blue-800", children: "Go Home" })] }) })] }) }));
}
