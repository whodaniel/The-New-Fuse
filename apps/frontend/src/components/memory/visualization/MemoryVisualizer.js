"use strict";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryVisualizer = void 0;
import react_1 from 'react';
import d3 from 'd3';
var MemoryVisualizer = function (_a) {
    var clusters = _a.clusters, onClusterSelect = _a.onClusterSelect, onItemSelect = _a.onItemSelect, _b = _a.width, width = _b === void 0 ? 800 : _b, _c = _a.height, height = _c === void 0 ? 600 : _c;
    var svgRef = (0, react_1.useRef)(null);
    var _d = (0, react_1.useState)([]), nodes = _d[0], setNodes = _d[1];
    var _e = (0, react_1.useState)([]), links = _e[0], setLinks = _e[1];
    (0, react_1.useEffect)(function () {
        if (!clusters.size)
            return;
        var graphNodes = [];
        var graphLinks = [];
        clusters.forEach(function (cluster, clusterId) {
            graphNodes.push({
                id: clusterId,
                group: clusterId,
                value: cluster.items.length,
                label: cluster.label,
                type: 'cluster',
                data: cluster
            });
            cluster.items.forEach(function (item, index) {
                var itemId = "".concat(clusterId, "_item_").concat(index);
                graphNodes.push({
                    id: itemId,
                    group: clusterId,
                    value: 1,
                    label: typeof item.content === 'string'
                        ? item.content.substring(0, 20)
                        : 'Item',
                    type: 'item',
                    data: item
                });
                graphLinks.push({
                    source: clusterId,
                    target: itemId,
                    value: item.metadata.confidence
                });
            });
        });
        setNodes(graphNodes);
        setLinks(graphLinks);
        var simulation = d3.forceSimulation(graphNodes)
            .force('link', d3.forceLink(graphLinks)
            .id(function (d) { return d.id; })
            .distance(function (d) { return 100 / (d.value || 1); }))
            .force('charge', d3.forceManyBody().strength(-50))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(function (d) { return Math.sqrt(d.value) * 10; }));
        var svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();
        var container = svg.append('g');
        svg.call(d3.zoom()
            .extent([[0, 0], [width, height]])
            .scaleExtent([0.1, 4])
            .on('zoom', function (event) {
            container.attr('transform', event.transform);
        }));
        var link = container.append('g')
            .selectAll('line')
            .data(graphLinks)
            .join('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', function (d) { return Math.sqrt(d.value); });
        var node = container.append('g')
            .selectAll('g')
            .data(graphNodes)
            .join('g')
            .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));
        node.append('circle')
            .attr('r', function (d) { return Math.sqrt(d.value) * 5; })
            .attr('fill', function (d) { return d.type === 'cluster' ? '#ff7f0e' : '#1f77b4'; })
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5);
        node.append('text')
            .text(function (d) { return d.label; })
            .attr('x', 6)
            .attr('y', 3)
            .style('font-size', '10px')
            .style('fill', '#333');
        node.append('title')
            .text(function (d) { return d.label; });
        node.on('click', function (event, d) {
            if (d.type === 'cluster' && onClusterSelect) {
                onClusterSelect(d.id);
            }
            else if (d.type === 'item' && onItemSelect) {
                onItemSelect(d.data);
            }
        });
        simulation.on('tick', function () {
            link
                .attr('x1', function (d) { return d.source.x; })
                .attr('y1', function (d) { return d.source.y; })
                .attr('x2', function (d) { return d.target.x; })
                .attr('y2', function (d) { return d.target.y; });
            node
                .attr('transform', function (d) { return "translate(".concat(d.x, ",").concat(d.y, ")"); });
        });
        function dragstarted(event) {
            if (!event.active)
                simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }
        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }
        function dragended(event) {
            if (!event.active)
                simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }
        return function () {
            simulation.stop();
        };
    }, [clusters, width, height, onClusterSelect, onItemSelect]);
    return (_jsxs("div", { className: "memory-visualizer", children: [_jsx("svg", { ref: svgRef, width: width, height: height, viewBox: "0 0 ".concat(width, " ").concat(height) }), _jsx("style", { jsx: true, children: "\n                .memory-visualizer {\n                    background: #fff;\n                    border-radius: 8px;\n                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);\n                    overflow: hidden;\n                }\n\n                svg {\n                    display: block;\n                }\n            " })] }));
};
exports.MemoryVisualizer = MemoryVisualizer;
