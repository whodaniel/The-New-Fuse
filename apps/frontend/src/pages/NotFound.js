import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
d;
var NotFound = function () {
    return (_jsx("div", { className: "min-h-screen bg-gray-100 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-4xl font-bold text-gray-900", children: "404" }), _jsx("p", { className: "mt-2 text-lg text-gray-600", children: "Page not found" }), _jsx(Link, { to: "/", className: "mt-4 inline-block text-blue-500 hover:text-blue-600", children: "Return to home" })] }) }));
};
export default NotFound;
