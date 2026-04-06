import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  Heading,
  Icon,
  Menu,
  MenuDivider,
  MenuItem,
  MenuList,
  Portal,
  Text,
  useToast,
} from '@chakra-ui/react';
import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import { FiActivity, FiInfo, FiSearch, FiShield } from 'react-icons/fi';
import { io } from 'socket.io-client';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  type: string;
  label: string;
  connections: number;
  latency: number;
  status?: string;
  platform?: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  type: string;
}

const AgentFlowViewer = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<Node, undefined> | null>(null);
  const [, setLoading] = useState(true);
  const [data, setData] = useState<{ nodes: Node[]; links: Link[] }>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toast = useToast();
  const socketRef = useRef<any>(null);

  const fetchLiveData = async () => {
    try {
      const agentsRes = await fetch('/api/agents');
      const agents = await agentsRes.json();
      const relsRes = await fetch('/agent-relationships.json');
      const relationships = await relsRes.json();

      const liveNodes: Node[] = agents.map((a: any) => ({
        id: a.id,
        type: a.role || 'worker',
        label: a.name,
        platform: a.platform,
        status: a.isOnline ? 'active' : 'offline',
        connections: 0,
        latency: Math.floor(Math.random() * 50) + 10,
      }));

      const nameToId = new Map(liveNodes.map((n) => [n.label.toLowerCase(), n.id]));
      const liveLinks: Link[] = [];

      relationships.edges.forEach((rel: any) => {
        const sourceId = nameToId.get(rel.source.toLowerCase()) || rel.source;
        const targetId = nameToId.get(rel.target.toLowerCase()) || rel.target;
        if (liveNodes.find((n) => n.id === sourceId) && liveNodes.find((n) => n.id === targetId)) {
          liveLinks.push({ source: sourceId, target: targetId, type: rel.type });
        }
      });

      setData({ nodes: liveNodes, links: liveLinks });
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch live agent data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
    const socket = io();
    socketRef.current = socket;
    socket.on('agent_heartbeat', (payload) => {
      setData((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === payload.agentId ? { ...n, status: 'active', lastSeen: Date.now() } : n
        ),
      }));
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const handleNodeContextMenu = (event: any, d: Node) => {
    event.preventDefault();
    setSelectedNode(d);
    setMenuPos({ x: event.pageX, y: event.y });
    setIsMenuOpen(true);
  };

  const triggerHeartbeat = () => {
    if (!selectedNode || !socketRef.current) return;
    socketRef.current.emit('agent_command', {
      agentId: selectedNode.id,
      command: 'HEARTBEAT_PULSE',
      timestamp: Date.now(),
    });
    toast({
      title: 'Command Sent',
      description: `Pulse heartbeat sent to ${selectedNode.label}`,
      status: 'success',
      duration: 2000,
    });
    setIsMenuOpen(false);
  };

  const triggerAudit = () => {
    toast({
      title: 'Audit Triggered',
      description: `Strict Attribution Audit scheduled for ${selectedNode?.label}`,
      status: 'info',
      duration: 3000,
    });
    setIsMenuOpen(false);
  };

  useEffect(() => {
    if (!svgRef.current || data.nodes.length === 0) return;
    const width = 800;
    const height = 600;
    d3.select(svgRef.current).selectAll('*').remove();
    const svg = d3
      .select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('max-width', '100%')
      .style('height', 'auto');

    svg
      .append('defs')
      .selectAll('marker')
      .data(['delegates', 'routes_to', 'handoff', 'feeds', 'governs'])
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
      .attr('fill', '#4299e1');

    const g = svg.append('g');
    const colorMap: Record<string, string> = {
      orchestrator: '#667eea',
      worker: '#f56565',
      broker: '#48bb78',
      participant: '#ed8936',
      offline: '#a0aec0',
    };

    const simulation = d3
      .forceSimulation<Node>(data.nodes)
      .force(
        'link',
        d3
          .forceLink<Node, Link>(data.links)
          .id((d) => d.id)
          .distance(150)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    simulationRef.current = simulation;

    const link = g
      .append('g')
      .selectAll('line')
      .data(data.links)
      .join('line')
      .attr('stroke', '#4299e1')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', (d) => `url(#${d.type})`);

    const node = g
      .append('g')
      .selectAll('g')
      .data(data.nodes)
      .join('g')
      .on('contextmenu', handleNodeContextMenu)
      .call(d3.drag<any, Node>().on('start', dragstarted).on('drag', dragged).on('end', dragended));

    node
      .append('circle')
      .attr('r', 18)
      .attr('fill', (d) =>
        d.status === 'offline' ? colorMap.offline : colorMap[d.type] || colorMap.worker
      )
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    node
      .append('text')
      .text((d) => d.label)
      .attr('dy', 30)
      .attr('text-anchor', 'middle')
      .style('font-family', 'sans-serif')
      .style('font-size', '10px')
      .style('fill', '#4a5568')
      .style('font-weight', 'bold');

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
  }, [data]);

  return (
    <Box
      bg="white"
      p={4}
      borderRadius="xl"
      boxShadow="md"
      border="1px solid"
      borderColor="gray.200"
      position="relative"
    >
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md" color="gray.700">
          Live Agent Swarm Graph
        </Heading>
        <ButtonGroup size="sm" isAttached variant="outline">
          <Button onClick={fetchLiveData} leftIcon={<Text>🔄</Text>}>
            Refresh
          </Button>
          <Button onClick={() => simulationRef.current?.alpha(1).restart()}>Reset Layout</Button>
        </ButtonGroup>
      </Flex>
      <Box h="600px" bg="gray.50" borderRadius="lg" overflow="hidden">
        <svg ref={svgRef} width="100%" height="100%"></svg>
      </Box>

      {/* Interactive Context Menu */}
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
        <Portal>
          <MenuList
            style={{ position: 'absolute', left: menuPos.x, top: menuPos.y }}
            bg="gray.800"
            borderColor="whiteAlpha.200"
            color="white"
            shadow="xl"
          >
            <Box px={3} py={2} borderBottom="1px solid" borderColor="whiteAlpha.100">
              <Text fontSize="xs" fontWeight="bold" color="cyan.400" textTransform="uppercase">
                Agent: {selectedNode?.label}
              </Text>
              <Text fontSize="10px" color="gray.400" isTruncated>
                {selectedNode?.id}
              </Text>
            </Box>
            <MenuItem
              bg="transparent"
              _hover={{ bg: 'whiteAlpha.100' }}
              icon={<Icon as={FiActivity} />}
              onClick={triggerHeartbeat}
            >
              Pulse Heartbeat
            </MenuItem>
            <MenuItem
              bg="transparent"
              _hover={{ bg: 'whiteAlpha.100' }}
              icon={<Icon as={FiShield} />}
              onClick={triggerAudit}
            >
              Trigger Strict Audit
            </MenuItem>
            <MenuDivider />
            <MenuItem
              bg="transparent"
              _hover={{ bg: 'whiteAlpha.100' }}
              icon={<Icon as={FiSearch} />}
            >
              Analyze Lineage
            </MenuItem>
            <MenuItem
              bg="transparent"
              _hover={{ bg: 'whiteAlpha.100' }}
              icon={<Icon as={FiInfo} />}
            >
              Inspect Metadata
            </MenuItem>
          </MenuList>
        </Portal>
      </Menu>

      <Flex justify="space-between" mt={4} fontSize="sm" color="gray.500">
        <Text>Registered Nodes: {data.nodes.length}</Text>
        <Text>Active Links: {data.links.length}</Text>
      </Flex>
    </Box>
  );
};

export default AgentFlowViewer;
