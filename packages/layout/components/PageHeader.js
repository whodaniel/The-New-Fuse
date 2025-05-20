"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageHeader = void 0;
var react_1 = require("react");
var Button_1 = require("../../core/components/ui/Button");
var Breadcrumbs_1 = require("./Breadcrumbs");
var PageHeader = function (_a) {
    var title = _a.title, description = _a.description, breadcrumbs = _a.breadcrumbs, onNavigate = _a.onNavigate, actions = _a.actions, status = _a.status;
    return className = "pb-6" >
        { /* Breadcrumbs */};
    {
        breadcrumbs && onNavigate && className;
        "mb-4" >
            items;
        {
            breadcrumbs;
        }
        onNavigate = { onNavigate } /  >
            /div>;
    }
    className;
    "md:flex md:items-center md:justify-between" >
        { /* Title and description */}
        < div;
    className = "flex-1 min-w-0" >
        className;
    "text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate" >
        { title }
        < /h1>;
    {
        description && className;
        "mt-1 text-sm text-gray-500" > { description } < /p>;
    }
    {
        status && className;
        {
            "mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium\n                ".concat(status.type === 'info'
                ? 'bg-blue-100 text-blue-800'
                : status.type === 'success'
                    ? 'bg-green-100 text-green-800'
                    : status.type === 'warning'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800', "\n              ");
        }
         >
            { status, : .message }
            < /div>;
    }
    /div>;
    { /* Actions */ }
    {
        actions && actions.length > 0 && className;
        "mt-4 flex space-x-3 md:mt-0 md:ml-4" >
            { actions, : .map(function (action, index) {
                    return key = { index };
                    variant = { action, : .variant || 'primary' };
                    onClick = { action, : .onClick } >
                        { action, : .icon && className, "mr-2":  > { action, : .icon } < /span> };
                }) };
        {
            action.label;
        }
        /Button_1.Button>;
        ;
    }
}
    < /div>;
/div>
    < /div>;
;
;
exports.PageHeader = PageHeader;
//# sourceMappingURL=PageHeader.js.map