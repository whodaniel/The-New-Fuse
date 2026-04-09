// @ts-nocheck
import * as d3 from 'd3';
import { Database, Maximize, Share2, ZoomIn, ZoomOut } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

interface ClusterItem {
  id: string;
  content: string;
  metadata: {
    confidence: number;
    source: string;
  };
}

interface MemoryCluster {
  id: string;
  label: string;
  items: ClusterItem[];
}

interface MemoryVisualizerProps {
  clusters: Map<string, MemoryCluster> | MemoryCluster[];
  onClusterSelect?: (id: string) => void;
  onItemSelect?: (item: ClusterItem) => void;
  width?: number;
  height?: number;
}

export const MemoryVisualizer: React.FC<MemoryVisualizerProps> = ({
  clusters,
  onClusterSelect,
  onItemSelect,
  width = 800,
  height = 600,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!clusters || (Array.isArray(clusters) && clusters.length === 0)) return;

    const graphNodes: any[] = [];
    const graphLinks: any[] = [];

    const clusterArray = Array.isArray(clusters) ? clusters : Array.from(clusters.values());

    clusterArray.forEach((cluster) => {
      graphNodes.push({
        id: cluster.id,
        group: cluster.id,
        value: cluster.items.length + 5,
        label: cluster.label,
        type: 'cluster',
        data: cluster,
      });

      cluster.items.forEach((item, index) => {
        const itemId = `${cluster.id}_item_${index}`;
        graphNodes.push({
          id: itemId,
          group: cluster.id,
          value: 2,
          label: item.content.length > 20 ? item.content.substring(0, 20) + '...' : item.content,
          type: 'item',
          data: item,
        });

        graphLinks.push({
          source: cluster.id,
          target: itemId,
          value: item.metadata.confidence || 0.5,
        });
      });
    });

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const container = svg.append('g');

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    const simulation = d3
      .forceSimulation(graphNodes)
      .force(
        'link',
        d3
          .forceLink(graphLinks)
          .id((d: any) => d.id)
          .distance(50)
          .strength(0.5)
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collision',
        d3.forceCollide().radius((d: any) => Math.sqrt(d.value) * 8 + 5)
      );

    const link = container
      .append('g')
      .selectAll('line')
      .data(graphLinks)
      .join('line')
      .attr('stroke', 'rgba(148, 163, 184, 0.2)')
      .attr('stroke-width', (d: any) => d.value * 2);

    const node = container
      .append('g')
      .selectAll('g')
      .data(graphNodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(d3.drag<any, any>().on('start', dragstarted).on('drag', dragged).on('end', dragended));

    // Glow effect
    const filter = svg.append('defs').append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    node
      .append('circle')
      .attr('r', (d: any) => Math.sqrt(d.value) * 6)
      .attr('fill', (d: any) =>
        d.type === 'cluster' ? 'rgba(96, 165, 250, 0.8)' : 'rgba(168, 85, 247, 0.6)'
      )
      .attr('stroke', (d: any) => (d.type === 'cluster' ? '#60a5fa' : '#a855f7'))
      .attr('stroke-width', 2)
      .style('filter', 'url(#glow)');

    node
      .append('text')
      .text((d: any) => d.label)
      .attr('x', (d: any) => Math.sqrt(d.value) * 6 + 4)
      .attr('y', 3)
      .style('font-size', '10px')
      .style('fill', '#94a3b8')
      .style('pointer-events', 'none')
      .style('font-family', 'Inter, sans-serif');

    node.on('click', (event, d: any) => {
      if (d.type === 'cluster' && onClusterSelect) {
        onClusterSelect(d.id);
      } else if (d.type === 'item' && onItemSelect) {
        onItemSelect(d.data);
      }
    });

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

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

    return () => {
      simulation.stop();
    };
  }, [clusters, width, height]);

  return (
    <div className="relative w-full h-full bg-slate-950/20 rounded-2xl border border-white/5 overflow-hidden backdrop-blur-sm group">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Database className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Semantic Space</h3>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
            Knowledge Topology
          </p>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-1">
        <VisualizerAction icon={<ZoomIn className="w-4 h-4" />} />
        <VisualizerAction icon={<ZoomOut className="w-4 h-4" />} />
        <VisualizerAction icon={<Maximize className="w-4 h-4" />} />
        <VisualizerAction icon={<Share2 className="w-4 h-4" />} />
      </div>

      <svg ref={svgRef} className="w-full h-full" style={{ background: 'transparent' }} />

      <div className="absolute bottom-4 left-4 z-10 flex gap-4">
        <LegendItem color="#60a5fa" label="Active Clusters" />
        <LegendItem color="#a855f7" label="Semantic Units" />
      </div>

      <div className="absolute bottom-4 right-4 z-10 text-[10px] text-gray-600 font-mono">
        ENGINE: TNF-D3-RELAY-V2
      </div>
    </div>
  );
};

const VisualizerAction: React.FC<{ icon: React.ReactNode }> = ({ icon }) => (
  <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
    {icon}
  </button>
);

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
  </div>
);

export default MemoryVisualizer;
