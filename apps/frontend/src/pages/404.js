import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
var NotFoundPage = function () {
    return (_jsx("div", { className: "min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4", children: _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4", children: "404" }), _jsx("h2", { className: "text-2xl font-semibold text-gray-200 mb-4", children: "Page Not Found" }), _jsx("p", { className: "text-gray-400 mb-8 max-w-md", children: "The page you're looking for doesn't exist or has been moved. Let's get you back on track." }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [_jsx(Button, { asChild: true, children: _jsxs(Link, { to: "/", children: [_jsx(Home, { className: "mr-2 h-4 w-4" }), "Back to Home"] }) }), _jsxs(Button, { variant: "outline", onClick: function () { return window.history.back(); }, children: [_jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }), "Go Back"] })] })] }) }));
};
export default NotFoundPage;
