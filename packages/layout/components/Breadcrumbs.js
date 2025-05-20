"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
Object.defineProperty(exports, "__esModule", { value: true });
exports.Breadcrumbs = void 0;
var react_1 = require("react");
var Breadcrumbs = function (_a) {
    var items = _a.items, onNavigate = _a.onNavigate;
    return className = "flex";
    aria - label;
    "Breadcrumb" >
        className;
    "flex items-center space-x-2" >
        onClick;
    {
        function () { return onNavigate('/'); }
    }
    className = "text-gray-500 hover:text-gray-700" >
        className;
    "h-5 w-5";
    fill = "currentColor";
    viewBox = "0 0 20 20" >
        d;
    "M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /  >
        /svg>
        < /button>
        < /li>;
    {
        items.map(function (item, index) {
            return key = { item, : .path } >
                className;
            "flex items-center" >
                className;
            "h-5 w-5 text-gray-400";
            fill = "currentColor";
            viewBox = "0 0 20 20" >
                fillRule;
            "evenodd";
            d = "M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z";
            clipRule = "evenodd" /  >
                /svg>
                < button;
            onClick = { function() { return onNavigate(item.path); } };
            className = { "ml-2 text-sm font-medium ": .concat(index === items.length - 1
                    ? 'text-gray-700'
                    : 'text-gray-500 hover:text-gray-700') };
            aria - current;
            {
                index === items.length - 1 ? 'page' : undefined;
            }
             >
                { item, : .label }
                < /button>
                < /div>
                < /li>;
        });
    }
}
    < /ol>
    < /nav>;
;
exports.Breadcrumbs = Breadcrumbs;
//# sourceMappingURL=Breadcrumbs.js.map