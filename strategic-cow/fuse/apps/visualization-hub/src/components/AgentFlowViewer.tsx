import { Box, Button, ButtonGroup, Flex, Heading, Select, Text } from '@chakra-ui/react';
import * as d3 from 'd3';
import { useEffect, useRef } from 'react';

const agentData = {
  nodes: [
    {
      id: 'orchestrator-agent',
      type: 'orchestrator',
      label: 'Orchestrator',
      connections: 8,
      latency: 12,
    },
    {
      id: 'nestjs-endpoint-generator',
      type: 'task',
      label: 'NestJS Endpoint',
      connections: 3,
      latency: 45,
    },
    {
      id: 'agent-flow-analyzer',
      type: 'task',
      label: 'Flow Analyzer',
      connections: 5,
      latency: 78,
    },
    {
      id: 'mcp-server-integrator',
      type: 'task',
      label: 'MCP Integrator',
      connections: 4,
      latency: 34,
    },
    { id: 'database-service', type: 'service', label: 'Database', connections: 6, latency: 15 },
    { id: 'redis-cache', type: 'service', label: 'Redis Cache', connections: 7, latency: 8 },
    {
      id: 'workflow-coordinator',
      type: 'coordinator',
      label: 'Workflow',
      connections: 4,
      latency: 23,
    },
    {
      id: 'content-writer-agent',
      type: 'task',
      label: 'Content Writer',
      connections: 2,
      latency: 120,
    },
    { id: 'seo-optimizer', type: 'task', label: 'SEO Optimizer', connections: 3, latency: 89 },
    { id: 'api-gateway', type: 'service', label: 'API Gateway', connections: 9, latency: 11 },
    {
      id: 'task-scheduler',
      type: 'coordinator',
      label: 'Task Scheduler',
      connections: 5,
      latency: 19,
    },
  ],
  links: [
    { source: 'orchestrator-agent', target: 'nestjs-endpoint-generator', type: 'request' },
    { source: 'orchestrator-agent', target: 'agent-flow-analyzer', type: 'request' },
    { source: 'orchestrator-agent', target: 'mcp-server-integrator', type: 'request' },
    { source: 'orchestrator-agent', target: 'workflow-coordinator', type: 'request' },
    { source: 'nestjs-endpoint-generator', target: 'database-service', type: 'request' },
    { source: 'agent-flow-analyzer', target: 'redis-cache', type: 'request' },
    { source: 'mcp-server-integrator', target: 'api-gateway', type: 'request' },
    { source: 'workflow-coordinator', target: 'task-scheduler', type: 'request' },
    { source: 'task-scheduler', target: 'content-writer-agent', type: 'request' },
    { source: 'task-scheduler', target: 'seo-optimizer', type: 'request' },
    { source: 'content-writer-agent', target: 'seo-optimizer', type: 'response' },
    { source: 'database-service', target: 'redis-cache', type: 'response' },
    { source: 'api-gateway', target: 'orchestrator-agent', type: 'response' },
  ],
};

const AgentFlowViewer = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<d3.SimulationNodeDatum, undefined> | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 800; // Fixed width for component, or use ResizeObserver
    const height = 600;

    // Clear previous render
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3
      .select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('max-width', '100%')
      .style('height', 'auto');

    // Define arrow markers
    svg
      .append('defs')
      .selectAll('marker')
      .data(['request', 'response'])
      .enter()
      .append('marker')
      .attr('id', (d) => d)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', (d) => (d === 'request' ? '#4299e1' : '#9f7aea'));

    const g = svg.append('g');

    // Color mapping
    const colorMap: Record<string, string> = {
      orchestrator: '#667eea',
      task: '#f56565',
      service: '#48bb78',
      coordinator: '#ed8936',
    };

    // Prepare data (deep copy to avoid mutation issues with React StrictMode)
    const nodes = agentData.nodes.map((d) => ({ ...d }));
    const links = agentData.links.map((d) => ({ ...d }));

    // Force Simulation
    const simulation = d3
      .forceSimulation(nodes as any)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(150)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    simulationRef.current = simulation;

    // Draw Links
    const link = g
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('class', 'link')
      .attr('stroke', (d) => (d.type === 'request' ? '#4299e1' : '#9f7aea'))
      .attr('stroke-width', 2)
      .attr('marker-end', (d) => `url(#${d.type})`);

    // Draw Nodes
    const node = g
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended) as any);

    node
      .append('circle')
      .attr('r', (d) => 15 + d.connections * 1.5)
      .attr('fill', (d) => colorMap[d.type])
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    node
      .append('text')
      .text((d) => d.label)
      .attr('dy', (d) => 25 + d.connections * 1.5)
      .attr('text-anchor', 'middle')
      .style('font-family', 'sans-serif')
      .style('font-size', '12px')
      .style('fill', '#4a5568')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')
      .style('text-shadow', '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Zoom
    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    return () => {
      simulation.stop();
    };
  }, []);

  const resetLayout = () => {
    if (simulationRef.current) {
      simulationRef.current.alpha(1).restart();
    }
  };

  return (
    <Box
      bg="white"
      p={4}
      borderRadius="xl"
      boxShadow="md"
      border="1px solid"
      borderColor="gray.200"
    >
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md" color="gray.700">
          Live Agent Communications
        </Heading>
        <ButtonGroup size="sm" isAttached variant="outline">
          <Button onClick={resetLayout}>Reset Layout</Button>
          <Select placeholder="Filter View" w="150px" size="sm" ml={2} borderRadius="md">
            <option value="all">All Agents</option>
            <option value="orchestrator">Orchestrator Only</option>
            <option value="critical">Critical Path</option>
          </Select>
        </ButtonGroup>
      </Flex>
      <Box h="600px" bg="gray.50" borderRadius="lg" overflow="hidden">
        <svg ref={svgRef} width="100%" height="100%"></svg>
      </Box>
      <Flex justify="space-between" mt={4} fontSize="sm" color="gray.500">
        <Text>Active Agents: {agentData.nodes.length}</Text>
        <Text>Total Messages/sec: 142</Text>
      </Flex>
    </Box>
  );
};

export default AgentFlowViewer;
