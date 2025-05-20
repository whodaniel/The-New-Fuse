"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s)
                if (Object.prototype.hasOwnProperty.call(s, p))
                    t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardGrid = void 0;
var react_1 = require("react");
var react_grid_layout_1 = require("react-grid-layout");
var DashboardContext_1 = require("../DashboardContext");
var MetricCard_1 = require("./MetricCard");
var ChartWidget_1 = require("./ChartWidget");
var ListWidget_1 = require("./ListWidget");
var TableWidget_1 = require("./TableWidget");
var ResponsiveGridLayout = (0, react_grid_layout_1.WidthProvider)(react_grid_layout_1.Responsive);
var DashboardGrid = function (_a) {
    var _b = _a.className, className = _b === void 0 ? '' : _b, onLayoutChange = _a.onLayoutChange;
    var _c = (0, DashboardContext_1.useDashboard)(), widgets = _c.widgets, layouts = _c.layouts, currentLayout = _c.currentLayout, updateLayout = _c.updateLayout, refreshWidget = _c.refreshWidget;
    var currentLayoutConfig = layouts.find(function (l) { return l.id === currentLayout; });
    var getWidgetComponent = (0, react_1.useCallback)(function (widget) {
        switch (widget.type) {
            case 'metric':
                return metric;
                {
                    widget.data;
                }
                />;
            case 'chart':
                return data = { widget, : .data };
                type = "line";
                title = { widget, : .title };
                description = { widget, : .description };
                loading = { widget, : .loading };
                error = { widget, : .error } /  > ;
        }
    });
};
'list';
return data = { widget, : .data };
title = { widget, : .title };
description = { widget, : .description };
loading = { widget, : .loading };
error = { widget, : .error } /  > ;
;
'table';
return data = { widget, : .data };
title = { widget, : .title };
description = { widget, : .description };
loading = { widget, : .loading };
error = { widget, : .error } /  > ;
;
return null;
[];
;
var handleLayoutChange = (0, react_1.useCallback)(function (layout) {
    if (currentLayoutConfig) {
        var updatedLayout = __assign(__assign({}, currentLayoutConfig), { widgets: layout.map(function (item) {
                return ({
                    id: item.i,
                    position: {
                        x: item.x,
                        y: item.y,
                        w: item.w,
                        h: item.h,
                    },
                });
            }) });
        updateLayout(updatedLayout);
        onLayoutChange === null || onLayoutChange === void 0 ? void 0 : onLayoutChange(layout);
    }
}, [currentLayoutConfig, updateLayout, onLayoutChange]);
if (!currentLayoutConfig) {
    return null;
}
var gridLayout = currentLayoutConfig.widgets.map(function (item) {
    return ({
        i: item.id,
        x: item.position.x,
        y: item.position.y,
        w: item.position.w,
        h: item.position.h,
    });
});
return className = { "min-h-screen ": .concat(className) };
layouts = {};
{
    lg: gridLayout;
}
breakpoints = {};
{
    lg: 1200, md;
    996, sm;
    768, xs;
    480, xxs;
    0;
}
cols = {};
{
    lg: 12, md;
    10, sm;
    6, xs;
    4, xxs;
    2;
}
rowHeight = { 100:  };
onLayoutChange = { handleLayoutChange };
isDraggable;
isResizable;
margin = { [16, 16]:  } >
    { widgets, : .map(function (widget) {
            return key = { widget, : .id };
            className = "bg-white rounded-lg shadow-sm overflow-hidden" >
                className;
            "absolute top-2 right-2 z-10 flex space-x-1" >
                onClick;
            {
                function () { return refreshWidget(widget.id); }
            }
            className = "p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100" >
                className;
            "h-4 w-4";
            fill = "none";
            stroke = "currentColor";
            viewBox = "0 0 24 24" >
                strokeLinecap;
            "round";
            strokeLinejoin = "round";
            strokeWidth = { 2:  };
            d = "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /  >
                /svg>
                < /button>
                < button;
            className = "p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100" >
                className;
            "h-4 w-4";
            fill = "none";
            stroke = "currentColor";
            viewBox = "0 0 24 24" >
                strokeLinecap;
            "round";
            strokeLinejoin = "round";
            strokeWidth = { 2:  };
            d = "M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /  >
                /svg>
                < /button>
                < /div>;
            {
                getWidgetComponent(widget);
            }
            /div>;
        }) };
/ResponsiveGridLayout>;
;
;
exports.DashboardGrid = DashboardGrid;
//# sourceMappingURL=DashboardGrid.js.map