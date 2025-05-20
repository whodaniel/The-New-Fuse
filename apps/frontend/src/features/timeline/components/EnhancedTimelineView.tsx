import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { TimelineViewProps } from '../../../types/components.js';
import { D3Selection, TimelineScales, ZoomBehavior } from '../../../types/d3.js';
import { TimelineEvent, TimelineBranch } from '../../../types/timeline.js';

export const EnhancedTimelineView: React.React.FC<TimelineViewProps> = ({
  events,
  branches,
  workflows,
  currentBranchId,
  onBranchSelect,
  onEventClick,
  onCreateBranch,
  onMergeBranch
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const scales = useRef<TimelineScales>();
  const zoom = useRef<ZoomBehavior>();

  useEffect(() => {
    if (!svgRef.current || !events.length) return;
    
    const svg = d3.select(svgRef.current) as D3Selection;
    initializeTimeline(svg);
    renderTimeline(svg);
  }, [events, branches, currentBranchId]);

  const initializeTimeline = (svg: D3Selection) => {
    const width = svg.node()?.getBoundingClientRect().width ?? 800;
    const height = svg.node()?.getBoundingClientRect().height ?? 600;
    
    scales.current = {
      x: d3.scaleTime()
        .domain(d3.extent(events, (e: any) => new Date(e.timestamp)) as [Date, Date])
        .range([50, width - 50]),
      y: d3.scaleLinear()
        .domain([0, branches.length])
        .range([50, height - 50])
    };

    zoom.current = d3.zoom()
      .scaleExtent([0.5, 5])
      .on('zoom', (event) => {
        svg.selectAll('g').attr('transform', event.transform);
      });

    svg.call(zoom.current);
  };

  const renderTimeline = (svg: D3Selection) => {
    // Clear previous render
    svg.selectAll('*').remove();

    // Create branch lanes
    const branchLanes = svg
      .append('g')
      .selectAll('line')
      .data(branches)
      .enter()
      .append('line')
      .attr('x1', scales.current!.x.range()[0])
      .attr('x2', scales.current!.x.range()[1])
      .attr('y1', (d, i) => scales.current!.y(i))
      .attr('y2', (d, i) => scales.current!.y(i))
      .attr('stroke', d => d.id === currentBranchId ? '#4CAF50' : '#ccc')
      .attr('stroke-width', 2);

    // Create events
    const eventGroups = svg
      .append('g')
      .selectAll('g')
      .data(events)
      .enter()
      .append('g')
      .attr('transform', d => {
        const branchIndex = branches.findIndex(b => b.id === d.branchId);
        return `translate(${scales.current!.x(new Date(d.timestamp))},${scales.current!.y(branchIndex)})`;
      })
      .on('click', (_, d) => onEventClick(d));

    // Add event circles
    eventGroups
      .append('circle')
      .attr('r', 6)
      .attr('fill', d => getEventColor(d));

    // Add event labels
    eventGroups
      .append('text')
      .attr('dx', 8)
      .attr('dy', 4)
      .text(d => d.title)
      .attr('font-size', '12px');
  };

  const getEventColor = (event: TimelineEvent): string => {
    switch (event.type) {
      case 'FEATURE': return '#2196F3';
      case 'MERGE': return '#9C27B0';
      case 'BRANCH': return '#FF9800';
      case 'WORKFLOW': return '#4CAF50';
      default: return '#757575';
    }
  };

  return (
    <div className="enhanced-timeline-view">
      <svg 
        ref={svgRef}
        width="100%"
        height="600px"
        className="timeline-svg"
      />
    </div>
  );
};