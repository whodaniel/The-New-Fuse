import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';
import * as d3 from 'd3';
import { useEffect, useRef } from 'react';

const serviceData = {
  name: 'The New Fuse',
  children: [
    {
      name: 'Frontend',
      children: [
        { name: 'Visualization Hub', size: 4500, status: 'healthy', port: 3008 },
        { name: 'Admin Dashboard', size: 8200, status: 'healthy', port: 3000 },
        { name: 'Auth UI', size: 3100, status: 'healthy', port: 3000 },
      ],
    },
    {
      name: 'Backend API',
      children: [
        { name: 'Core API', size: 12000, status: 'healthy', port: 3001 },
        { name: 'Agent Registry', size: 5400, status: 'healthy', port: 3004 },
        { name: 'MCP DRS API', size: 7800, status: 'healthy', port: 3000 },
      ],
    },
    {
      name: 'Orchestration',
      children: [
        { name: 'Relay Server', size: 3200, status: 'healthy', port: 3001 },
        { name: 'Workflow Engine', size: 9100, status: 'healthy', port: 3002 },
        { name: 'Stall Detector', size: 1500, status: 'healthy' },
      ],
    },
    {
      name: 'Infrastructure',
      children: [
        { name: 'PostgreSQL', size: 15000, status: 'healthy', port: 5433 },
        { name: 'Redis', size: 2500, status: 'healthy', port: 6380 },
        { name: 'Browser Hub', size: 6700, status: 'degraded', port: 8080 },
      ],
    },
  ],
};

const ServiceArchitectureMap = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 800;
    const height = 500;

    // Clear previous render
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3
      .select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('max-width', '100%')
      .style('height', 'auto');

    const root = d3
      .hierarchy(serviceData)
      .sum((d: any) => d.size || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const treemap = d3.treemap().size([width, height]).paddingOuter(10).paddingInner(4);

    treemap(root);

    const cell = svg
      .selectAll('g')
      .data(root.leaves())
      .join('g')
      .attr('transform', (d: any) => `translate(${d.x0},${d.y0})`);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    cell
      .append('rect')
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('height', (d: any) => d.y1 - d.y0)
      .attr('fill', (d: any) => {
        if (d.data.status === 'degraded') return '#ecc94b';
        if (d.data.status === 'error') return '#f56565';
        return color(d.parent?.data.name || 'default');
      })
      .attr('opacity', 0.8)
      .attr('rx', 4);

    cell
      .append('text')
      .selectAll('tspan')
      .data((d: any) => [d.data.name, d.data.port ? `Port: ${d.data.port}` : ''])
      .join('tspan')
      .attr('x', 5)
      .attr('y', (d, i) => 15 + i * 15)
      .text((d) => d)
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold');

    return () => {
      // Cleanup if needed
    };
  }, []);

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
          Service Architecture Map
        </Heading>
        <Button size="sm" variant="ghost">
          Refresh Stats
        </Button>
      </Flex>
      <Box h="500px" bg="gray.50" borderRadius="lg" overflow="hidden">
        <svg ref={svgRef} width="100%" height="100%"></svg>
      </Box>
      <Flex justify="space-between" mt={4} fontSize="sm" color="gray.500">
        <Text>Total Services: 12</Text>
        <Text>System Status: Healthy</Text>
      </Flex>
    </Box>
  );
};

export default ServiceArchitectureMap;
