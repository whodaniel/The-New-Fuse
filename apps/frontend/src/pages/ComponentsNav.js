import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
/**
 * ComponentsNav - A simple navigation page to access the components showcase
 */
var ComponentsNav = function () {
    return (_jsx("div", { className: "min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4", children: _jsxs("div", { className: "max-w-md w-full bg-white rounded-lg shadow-lg p-8", children: [_jsx("h1", { className: "text-3xl font-bold text-center mb-8", children: "UI Components Navigation" }), _jsxs("div", { className: "space-y-4", children: [_jsx(Link, { to: "/components", className: "block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md text-center transition-colors", children: "View All Components" }), _jsx(Link, { to: "/layout-example", className: "block w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md text-center transition-colors", children: "View Layout Example" }), _jsx(Link, { to: "/", className: "block w-full py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md text-center transition-colors", children: "Back to Home" })] })] }) }));
};
export default ComponentsNav;
