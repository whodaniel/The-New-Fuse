import * as d3 from 'd3';
import React, { useEffect } from 'react';
import type { TopologyLink, TopologyNode } from '../services/operatorSynergy/types';

interface NetworkGraphProps {
  nodes: TopologyNode[];
  links: TopologyLink[];
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ nodes, links }) => {
  const svgRef = React.useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    // Clear previous render
    d3.select(svgRef.current).selectAll('*').remove();

    const width = 800;
    const height = 400;

    const svg = d3
      .select(svgRef.current)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', [0, 0, width, height]);

    const simulation = d3
      .forceSimulation(nodes as any)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(100)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Draw Links
    const link = svg
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', (d) => (d.active ? '#6366f1' : '#334155'))
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6);

    // Draw Nodes
    const node = svg
      .append('g')
      .selectAll('circle')
      .data(nodes)
      .join('g')
      .call(drag(simulation) as any);

    node
      .append('circle')
      .attr('r', 20)
      .attr('fill', (d) => {
        if (d.group === 'local') return '#10b981';
        if (d.group === 'relay') return '#6366f1';
        if (d.group === 'cloud') return '#3b82f6';
        return '#8b5cf6';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    node
      .append('text')
      .text((d) => d.label)
      .attr('x', 24)
      .attr('y', 4)
      .attr('fill', '#cbd5e1')
      .attr('font-size', '12px')
      .style('pointer-events', 'none');

    // Ticking animation
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Drag behavior
    function drag(simulation: any) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended);
    }
  }, [nodes, links]);

  return (
    <div
      className="network-graph-container"
      style={{
        width: '100%',
        height: '400px',
        background: '#020617',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
