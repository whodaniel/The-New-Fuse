"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sidebar = void 0;
var react_1 = require("react");
var LayoutContext_1 = require("./LayoutContext");
var Sidebar = function (_a) {
    var navigation = _a.navigation, currentPath = _a.currentPath, onNavigate = _a.onNavigate;
    var sidebarOpen = (0, LayoutContext_1.useLayout)().sidebarOpen;
    var renderNavigationItem = function (item, depth) {
        var _a;
        if (depth === void 0) {
            depth = 0;
        }
        var isActive = currentPath === item.path;
        var hasChildren = item.children && item.children.length > 0;
        return key = { item, : .id };
        className = { depth } > 0 ? 'ml-4' : '';
    } >
        onClick, { function:  };
    () => { return onNavigate(item.path); };
}, className = { "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ": .concat(isActive
        ? 'bg-blue-50 text-blue-600'
        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50') } >
    { item, : .icon && className, "mr-3 flex-shrink-0 h-5 w-5":  > { item, : .icon } < /span> }
    < span, className = "flex-1 truncate" > { item, : .label } < /span>;
{
    item.badge && className;
    {
        "ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium\n                ".concat(item.badge.variant === 'primary'
            ? 'bg-blue-100 text-blue-800'
            : item.badge.variant === 'secondary'
                ? 'bg-gray-100 text-gray-800'
                : item.badge.variant === 'success'
                    ? 'bg-green-100 text-green-800'
                    : item.badge.variant === 'warning'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800', "\n              ");
    }
     >
        { item, : .badge.label }
        < /span>;
}
{
    hasChildren && className;
    {
        "ml-2 h-5 w-5 transform transition-transform duration-200 ".concat(isActive ? 'rotate-90' : '');
    }
    viewBox = "0 0 20 20";
    fill = "currentColor" >
        fillRule;
    "evenodd";
    d = "M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z";
    clipRule = "evenodd" /  >
        /svg>;
}
/button>;
{
    hasChildren && isActive && className;
    "mt-1" >
        {}(_a = item.children) === null || _a === void 0 ? void 0 : _a.map(function (child) { return renderNavigationItem(child, depth + 1); });
}
/div>;
/div>;
;
;
return className = { "fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ": .concat(sidebarOpen ? 'translate-x-0' : '-translate-x-full') } >
    className;
"flex flex-col h-full" >
    { /* Navigation */}
    < nav;
className = "flex-1 px-2 py-4 space-y-1 overflow-y-auto" >
    { navigation, : .map(function (item) { return renderNavigationItem(item); }) }
    < /nav>;
{ /* Footer */ }
className;
"flex-shrink-0 p-4 border-t border-gray-200" >
    className;
"flex items-center space-x-3" >
    className;
"flex-shrink-0" >
    className;
"h-8 w-8";
src = "/logo-small.svg";
alt = "The New Fuse" /  >
    /div>
    < div;
className = "flex-1 min-w-0" >
    className;
"text-sm font-medium text-gray-900 truncate" >
    The;
New;
Fuse
    < /p>
    < p;
className = "text-xs text-gray-500 truncate" > v1;
.0;
.0 < /p>
    < /div>
    < /div>
    < /div>
    < /div>
    < /div>;
;
;
exports.Sidebar = Sidebar;
//# sourceMappingURL=Sidebar.js.map