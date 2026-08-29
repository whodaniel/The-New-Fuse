"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardRoot = void 0;
import jsx_runtime_1 from 'react/jsx-runtime';
import WidgetGrid_1 from '@the-new-fuse/widgets/WidgetGrid';
import DataVisualization_1 from '@the-new-fuse/visualization/DataVisualization';
import MetricsPanel_1 from '@the-new-fuse/metrics/MetricsPanel';
const DashboardRoot = () => () => () => {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "dashboard-container", children: [(0, jsx_runtime_1.jsx)(MetricsPanel_1.MetricsPanel, {}), (0, jsx_runtime_1.jsx)(WidgetGrid_1.WidgetGrid, {}), (0, jsx_runtime_1.jsx)(DataVisualization_1.DataVisualization, {})] }));
};
exports.DashboardRoot = DashboardRoot;
__exportStar(require("@the-new-fuse/widgets"), exports);
__exportStar(require("@the-new-fuse/visualization"), exports);
__exportStar(require("@the-new-fuse/metrics"), exports);
//# sourceMappingURL=DashboardRoot.js.map