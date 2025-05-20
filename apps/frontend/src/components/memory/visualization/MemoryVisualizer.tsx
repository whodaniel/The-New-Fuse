"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryVisualizer = void 0;
import react_1 from 'react';
import d3 from 'd3';
const MemoryVisualizer = ({ clusters, onClusterSelect, onItemSelect, width = 800, height = 600 }) => {
    const svgRef = (0, react_1.useRef)(null);
    const [nodes, setNodes] = (0, react_1.useState)([]);
    const [links, setLinks] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        if (!clusters.size)
            return;
        const graphNodes = [];
        const graphLinks = [];
        clusters.forEach((cluster, clusterId) => {
            graphNodes.push({
                id: clusterId,
                group: clusterId,
                value: cluster.items.length,
                label: cluster.label,
                type: 'cluster',
                data: cluster
            });
            cluster.items.forEach((item, index) => {
                const itemId = `${clusterId}_item_${index}`;
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
        const simulation = d3.forceSimulation(graphNodes)
            .force('link', d3.forceLink(graphLinks)
            .id(d => d.id)
            .distance(d => 100 / (d.value || 1)))
            .force('charge', d3.forceManyBody().strength(-50))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(d => Math.sqrt(d.value) * 10));
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();
        const container = svg.append('g');
        svg.call(d3.zoom()
            .extent([[0, 0], [width, height]])
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
            container.attr('transform', event.transform);
        }));
        const link = container.append('g')
            .selectAll('line')
            .data(graphLinks)
            .join('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', d => Math.sqrt(d.value));
        const node = container.append('g')
            .selectAll('g')
            .data(graphNodes)
            .join('g')
            .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));
        node.append('circle')
            .attr('r', d => Math.sqrt(d.value) * 5)
            .attr('fill', d => d.type === 'cluster' ? '#ff7f0e' : '#1f77b4')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5);
        node.append('text')
            .text(d => d.label)
            .attr('x', 6)
            .attr('y', 3)
            .style('font-size', '10px')
            .style('fill', '#333');
        node.append('title')
            .text(d => d.label);
        node.on('click', (event, d) => {
            if (d.type === 'cluster' && onClusterSelect) {
                onClusterSelect(d.id);
            }
            else if (d.type === 'item' && onItemSelect) {
                onItemSelect(d.data);
            }
        });
        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
            node
                .attr('transform', d => `translate(${d.x},${d.y})`);
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
        return () => {
            simulation.stop();
        };
    }, [clusters, width, height, onClusterSelect, onItemSelect]);
    return (<div className="memory-visualizer">
            <svg ref={svgRef} width={width} height={height} viewBox={`0 0 ${width} ${height}`}/>
            <style jsx>{`
                .memory-visualizer {
                    background: #fff;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    overflow: hidden;
                }

                svg {
                    display: block;
                }
            `}</style>
        </div>);
};
exports.MemoryVisualizer = MemoryVisualizer;
export {};
//# sourceMappingURL=MemoryVisualizer.js.map