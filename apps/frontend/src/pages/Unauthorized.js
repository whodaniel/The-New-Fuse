import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
var Unauthorized = function () {
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "max-w-md w-full text-center", children: [_jsx("h1", { className: "text-7xl font-bold text-red-600", children: "401" }), _jsx("h2", { className: "mt-2 text-3xl font-bold text-gray-900", children: "Unauthorized Access" }), _jsx("p", { className: "mt-2 text-gray-600", children: "You don't have permission to access this page." }), _jsx("div", { className: "mt-6", children: _jsxs(Link, { to: "/dashboard", className: "text-base font-medium text-indigo-600 hover:text-indigo-500", children: ["Go to Dashboard", _jsx("span", { "aria-hidden": "true", children: " \u2192" })] }) })] }) }));
};
export default Unauthorized;
