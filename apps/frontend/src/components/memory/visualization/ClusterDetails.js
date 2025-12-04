"use strict";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClusterDetails = void 0;
import react_1 from 'react';
import react_chartjs_2_1 from 'react-chartjs-2';
var ClusterDetails = function (_a) {
    var cluster = _a.cluster, onClose = _a.onClose;
    var _b = (0, react_1.useState)(''), searchTerm = _b[0], setSearchTerm = _b[1];
    var filteredItems = cluster.items.filter(function (item) { return typeof item.content === 'string'
        ? item.content.toLowerCase().includes(searchTerm.toLowerCase())
        : JSON.stringify(item.content).toLowerCase().includes(searchTerm.toLowerCase()); });
    var coherenceData = {
        labels: ['Coherence'],
        datasets: [
            {
                label: 'Coherence',
                data: [cluster.coherence],
                backgroundColor: ['#36A2EB']
            }
        ]
    };
    return (_jsxs("div", { className: "cluster-details", children: [_jsxs("div", { className: "header", children: [_jsx("h3", { children: "Cluster Details" }), _jsx("button", { onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "content", children: [_jsxs("p", { children: [_jsx("strong", { children: "Label:" }), " ", cluster.label] }), _jsxs("p", { children: [_jsx("strong", { children: "Size:" }), " ", cluster.items.length, " items"] }), _jsxs("p", { children: [_jsx("strong", { children: "Coherence:" }), " ", cluster.coherence.toFixed(2)] }), _jsxs("p", { children: [_jsx("strong", { children: "Radius:" }), " ", cluster.radius.toFixed(2)] }), _jsxs("p", { children: [_jsx("strong", { children: "Centroid:" }), " ", Array.from(cluster.centroid).slice(0, 5).join(', '), "..."] }), _jsx(react_chartjs_2_1.Bar, { data: coherenceData, options: { responsive: true, maintainAspectRatio: false } })] }), _jsx("div", { className: "search-bar", children: _jsx("input", { type: "text", placeholder: "Search items...", value: searchTerm, onChange: function (e) { return setSearchTerm(e.target.value); } }) }), _jsxs("div", { className: "items-list", children: [_jsx("h4", { children: "Items" }), _jsx("ul", { children: filteredItems.map(function (item, index) { return (_jsx("li", { children: _jsx("span", { children: typeof item.content === 'string' ? item.content : JSON.stringify(item.content) }) }, index)); }) })] }), _jsx("style", { jsx: true, children: "\n                .cluster-details {\n                    background: #fff;\n                    padding: 20px;\n                    border-radius: 8px;\n                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);\n                    max-width: 400px;\n                    margin: 0 auto;\n                }\n\n                .header {\n                    display: flex;\n                    justify-content: space-between;\n                    align-items: center;\n                    border-bottom: 1px solid #eee;\n                    padding-bottom: 10px;\n                    margin-bottom: 10px;\n                }\n\n                .header h3 {\n                    margin: 0;\n                    color: #333;\n                }\n\n                .header button {\n                    background: none;\n                    border: none;\n                    font-size: 1.5em;\n                    color: #999;\n                    cursor: pointer;\n                }\n\n                .content p {\n                    margin: 5px 0;\n                    color: #555;\n                }\n\n                .search-bar {\n                    margin: 10px 0;\n                }\n\n                .search-bar input {\n                    width: 100%;\n                    padding: 8px;\n                    border-radius: 4px;\n                    border: 1px solid #ddd;\n                }\n\n                .items-list {\n                    margin-top: 20px;\n                }\n\n                .items-list h4 {\n                    margin-bottom: 10px;\n                    color: #333;\n                }\n\n                .items-list ul {\n                    list-style: none;\n                    padding: 0;\n                }\n\n                .items-list li {\n                    padding: 5px 0;\n                    border-bottom: 1px solid #eee;\n                    color: #666;\n                }\n            " })] }));
};
exports.ClusterDetails = ClusterDetails;
