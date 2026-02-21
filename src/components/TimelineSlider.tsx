import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { TimelineEvent } from '../types.js';

interface TimelineSliderProps {
    events: TimelineEvent[];
    onEventSelect?: (event: TimelineEvent) => void;
    width?: number;
    height?: number;
}

const TimelineSlider: React.FC<TimelineSliderProps> = ({
    events,
    onEventSelect,
    width = 800,
    height = 200
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    useEffect(() => {
        if (!svgRef.current || events.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const timeScale = d3.scaleTime()
            .domain([
                d3.min(events, d => new Date(d.timestamp)) || new Date(),
                d3.max(events, d => new Date(d.timestamp)) || new Date()
            ])
            .range([margin.left, width - margin.right]);

        const xAxis = d3.axisBottom(timeScale);

        // Create main group
        const mainGroup = svg.append('g');

        // Add events as circles
        const eventGroups = mainGroup.selectAll('.event')
            .data(events)
            .enter()
            .append('g')
            .attr('class', 'event')
            .attr('transform', d => `translate(${timeScale(new Date(d.timestamp))},${height / 2})`);

        // Add circles for events
        eventGroups.append('circle')
            .attr('r', 6)
            .attr('fill', '#4a90e2')
            .on('mouseover', function(event, d) {
                const tooltip = d3.select(tooltipRef.current);
                tooltip.style('visibility', 'visible')
                    .html(`
                        <div class="p-2 bg-white shadow-lg rounded">
                            <div class="font-bold">${d.title}</div>
                            ${d.description ? `<div class="mt-1">${d.description}</div>` : ''}
                        </div>
                    `)
                    .style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY - 10}px`);
            })
            .on('mouseout', () => {
                d3.select(tooltipRef.current)
                    .style('visibility', 'hidden');
            })
            .on('click', (event, d) => {
                if (onEventSelect) {
                    onEventSelect(d);
                }
            });

        // Add labels for events
        const noteGroups = mainGroup.selectAll('.note')
            .data(events)
            .enter()
            .append('g')
            .attr('class', 'note')
            .attr('transform', d => `translate(${timeScale(new Date(d.timestamp))},${height / 2 - 25})`);

        noteGroups.append('path')
            .attr('d', 'M0,0 L-5,10 L5,10 Z')
            .attr('fill', '#4a90e2');

        noteGroups.append('text')
            .attr('text-anchor', 'middle')
            .attr('y', -5)
            .text(d => d.title)
            .attr('fill', '#333')
            .attr('font-size', '12px');

        // Add axis
        mainGroup.append('g')
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(xAxis)
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');

    }, [events, width, height, margin, onEventSelect]);

    return (
        <div className="relative">
            <svg ref={svgRef} width={width} height={height} />
            <div ref={tooltipRef} className="absolute" style={{ visibility: 'hidden' }} />
        </div>
    );
};

export default TimelineSlider;