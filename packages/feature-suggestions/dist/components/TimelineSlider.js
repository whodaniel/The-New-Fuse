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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const d3 = __importStar(require("d3"));
function throttle(func, limit) {
    let timeout = null;
    let previous = 0;
    return function (...args) {
        const now = Date.now();
        if (previous && now < previous + limit) {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => {
                previous = now;
                return func.apply(this, args);
            }, limit);
        }
        else {
            previous = now;
            return func.apply(this, args);
        }
    }; // Cast the function to preserve the original signature
}
function debounce(func, wait) {
    let timeout = null;
    return function (...args) {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            const result = func.apply(this, args);
            timeout = null;
            return result;
        }, wait);
    }; // Cast the function to preserve the original signature
}
const getEventColor = (type) => {
    switch (type) {
        case 'SUGGESTION':
            return '#3b82f6';
        case 'TODO':
            return '#10b981';
        case 'FEATURE':
            return '#f59e0b';
        case 'WORKFLOW_STEP':
            return '#8b5cf6';
        case 'NOTE':
            return '#6b7280';
        default:
            return '#cbd5e1';
    }
};
const TimelineSlider = ({ events, onEventClick, onRangeSelect, onAddNote, ranges = [] }) => {
    const svgRef = (0, react_1.useRef)(null);
    const [_brushSelection, setBrushSelection] = react_1.default.useState(null);
    (0, react_1.useEffect)(() => {
        if (!svgRef.current || !events.length)
            return;
        const margin = { top: 20, right: 20, bottom: 20, left: 40 };
        const width = svgRef.current.clientWidth - margin.left - margin.right;
        const height = svgRef.current.clientHeight - margin.top - margin.bottom;
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();
        // Convert range dates to Date objects if they're strings
        const processedRanges = ranges.map(range => ({
            ...range,
            startDate: typeof range.startDate === 'string' ? new Date(range.startDate) : range.startDate,
            endDate: typeof range.endDate === 'string' ? new Date(range.endDate) : range.endDate
        }));
        // Get all timestamps including range dates
        const allDates = [
            ...events.map(e => new Date(e.timestamp)),
            ...processedRanges.map(r => r.startDate),
            ...processedRanges.map(r => r.endDate)
        ];
        const timeExtent = d3.extent(allDates);
        const xScale = d3.scaleTime()
            .domain(timeExtent)
            .range([0, width]);
        const _yScale = d3.scaleLinear()
            .domain([0, 1])
            .range([height, 0]);
        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        // Create axis
        const xAxis = d3.axisBottom(xScale);
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(xAxis);
        // Add ranges if available
        if (processedRanges.length > 0) {
            const rangesGroup = g.append('g').attr('class', 'ranges');
            rangesGroup.selectAll('.range')
                .data(processedRanges)
                .enter()
                .append('rect')
                .attr('class', 'range')
                .attr('x', d => xScale(d.startDate))
                .attr('y', 0)
                .attr('width', d => Math.max(2, xScale(d.endDate) - xScale(d.startDate)))
                .attr('height', height)
                .attr('fill', d => d.color)
                .attr('opacity', 0.2)
                .attr('rx', 3)
                .attr('ry', 3);
            rangesGroup.selectAll('.range-label')
                .data(processedRanges)
                .enter()
                .append('text')
                .attr('class', 'range-label')
                .attr('x', d => xScale(d.startDate) + (xScale(d.endDate) - xScale(d.startDate)) / 2)
                .attr('y', 15)
                .attr('text-anchor', 'middle')
                .attr('fill', d => d.color)
                .attr('font-size', '10px')
                .attr('font-weight', 'bold')
                .text(d => d.label);
        }
        // Add events
        const eventGroups = g.selectAll('.event')
            .data(events)
            .enter()
            .append('g')
            .attr('class', 'event')
            .attr('transform', d => `translate(${xScale(new Date(d.timestamp))},0)`);
        eventGroups.append('circle')
            .attr('r', 6)
            .attr('cy', height / 2)
            .attr('fill', d => getEventColor(d.type))
            .on('mouseover', function (event, d) {
            const tooltip = d3.select('#timeline-tooltip');
            tooltip
                .style('visibility', 'visible')
                .style('left', `${event.pageX + 10}px`)
                .style('top', `${event.pageY - 10}px`)
                .html(`
                        <div class="p-2">
                            <div class="font-medium">${d.data.title}</div>
                            <div class="text-sm text-gray-500">${d.type}</div>
                            <div class="text-sm">${new Date(d.timestamp).toLocaleDateString()}</div>
                        </div>
                    `);
        })
            .on('mouseout', () => {
            d3.select('#timeline-tooltip')
                .style('visibility', 'hidden');
        })
            .on('click', function (event, d) {
            if (onEventClick) {
                onEventClick(d);
            }
        });
        if (onRangeSelect) {
            const brush = d3.brushX()
                .extent([[0, 0], [width, height]])
                .on('end', function (event) {
                if (!event.selection)
                    return;
                const dateRange = event.selection.map(xScale.invert);
                setBrushSelection(dateRange);
                onRangeSelect(dateRange[0], dateRange[1]);
            });
            g.append('g')
                .attr('class', 'brush')
                .call(brush);
        }
    }, [events, onEventClick, onRangeSelect, ranges]);
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("svg", { ref: svgRef, className: "w-full h-32" }), (0, jsx_runtime_1.jsx)("div", { id: "timeline-tooltip", className: "fixed invisible bg-white shadow-lg rounded-lg border" })] }));
};
exports.default = TimelineSlider;
//# sourceMappingURL=TimelineSlider.js.map