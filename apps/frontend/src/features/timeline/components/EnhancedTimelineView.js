import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
export var EnhancedTimelineView = function (_a) {
    var events = _a.events, branches = _a.branches, workflows = _a.workflows, currentBranchId = _a.currentBranchId, onBranchSelect = _a.onBranchSelect, onEventClick = _a.onEventClick, onCreateBranch = _a.onCreateBranch, onMergeBranch = _a.onMergeBranch;
    var svgRef = useRef(null);
    var scales = useRef();
    var zoom = useRef();
    useEffect(function () {
        if (!svgRef.current || !events.length)
            return;
        var svg = d3.select(svgRef.current);
        initializeTimeline(svg);
        renderTimeline(svg);
    }, [events, branches, currentBranchId]);
    var initializeTimeline = function (svg) {
        var _a, _b, _c, _d;
        var width = (_b = (_a = svg.node()) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect().width) !== null && _b !== void 0 ? _b : 800;
        var height = (_d = (_c = svg.node()) === null || _c === void 0 ? void 0 : _c.getBoundingClientRect().height) !== null && _d !== void 0 ? _d : 600;
        scales.current = {
            x: d3.scaleTime()
                .domain(d3.extent(events, function (e) { return new Date(e.timestamp); }))
                .range([50, width - 50]),
            y: d3.scaleLinear()
                .domain([0, branches.length])
                .range([50, height - 50])
        };
        zoom.current = d3.zoom()
            .scaleExtent([0.5, 5])
            .on('zoom', function (event) {
            svg.selectAll('g').attr('transform', event.transform);
        });
        svg.call(zoom.current);
    };
    var renderTimeline = function (svg) {
        // Clear previous render
        svg.selectAll('*').remove();
        // Create branch lanes
        var branchLanes = svg
            .append('g')
            .selectAll('line')
            .data(branches)
            .enter()
            .append('line')
            .attr('x1', scales.current.x.range()[0])
            .attr('x2', scales.current.x.range()[1])
            .attr('y1', function (d, i) { return scales.current.y(i); })
            .attr('y2', function (d, i) { return scales.current.y(i); })
            .attr('stroke', function (d) { return d.id === currentBranchId ? '#4CAF50' : '#ccc'; })
            .attr('stroke-width', 2);
        // Create events
        var eventGroups = svg
            .append('g')
            .selectAll('g')
            .data(events)
            .enter()
            .append('g')
            .attr('transform', function (d) {
            var branchIndex = branches.findIndex(function (b) { return b.id === d.branchId; });
            return "translate(".concat(scales.current.x(new Date(d.timestamp)), ",").concat(scales.current.y(branchIndex), ")");
        })
            .on('click', function (_, d) { return onEventClick(d); });
        // Add event circles
        eventGroups
            .append('circle')
            .attr('r', 6)
            .attr('fill', function (d) { return getEventColor(d); });
        // Add event labels
        eventGroups
            .append('text')
            .attr('dx', 8)
            .attr('dy', 4)
            .text(function (d) { return d.title; })
            .attr('font-size', '12px');
    };
    var getEventColor = function (event) {
        switch (event.type) {
            case 'FEATURE': return '#2196F3';
            case 'MERGE': return '#9C27B0';
            case 'BRANCH': return '#FF9800';
            case 'WORKFLOW': return '#4CAF50';
            default: return '#757575';
        }
    };
    return (_jsx("div", { className: "enhanced-timeline-view", children: _jsx("svg", { ref: svgRef, width: "100%", height: "600px", className: "timeline-svg" }) }));
};
