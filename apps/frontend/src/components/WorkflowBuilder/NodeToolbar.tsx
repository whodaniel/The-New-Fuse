import React, { useState } from 'react';
import {
  Box,
  Flex,
  HStack,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  Tooltip,
  Text,
  Icon,
  SimpleGrid
} from '@chakra-ui/react';
import { ChevronDownIcon, AddIcon } from '@chakra-ui/icons';
import { FaRobot, FaTools, FaCode, FaDatabase, FaGlobe, FaWaveSquare, FaBell, FaSearch, FaFileAlt, FaMemory } from 'react-icons/fa';

interface NodeToolbarProps {
  onAddNode: (nodeType: string, position: { x: number, y: number }) => void;
}

const nodeCategories = [
  {
    name: 'AI',
    nodes: [
      { type: 'llm', label: 'LLM Completion', icon: FaRobot, description: 'Generate text using an LLM' },
      { type: 'tool', label: 'Tool Execution', icon: FaTools, description: 'Execute an AI tool' },
    ]
  },
  {
    name: 'Data',
    nodes: [
      { type: 'transform', label: 'Transform', icon: FaCode, description: 'Transform data (format, structure)' },
      { type: 'data', label: 'Data Source', icon: FaDatabase, description: 'Load data from a source' },
      { type: 'storage', label: 'Data Storage', icon: FaMemory, description: 'Store data' },
    ]
  },
  {
    name: 'Integration',
    nodes: [
      { type: 'api', label: 'API Call', icon: FaGlobe, description: 'Make HTTP requests to external APIs' },
      { type: 'webhook', label: 'Webhook', icon: FaWaveSquare, description: 'Send data to webhook endpoints' },
      { type: 'notification', label: 'Notification', icon: FaBell, description: 'Send notifications' },
    ]
  },
  {
    name: 'Advanced',
    nodes: [
      { type: 'vectorStore', label: 'Vector Store', icon: FaSearch, description: 'Work with vector databases' },
      { type: 'documentProcessing', label: 'Document Processing', icon: FaFileAlt, description: 'Process and chunk documents' },
      { type: 'condition', label: 'Condition', icon: FaCode, description: 'Conditional branching' },
    ]
  }
];

export const NodeToolbar: React.React.FC<NodeToolbarProps> = ({ onAddNode }) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const handleAddNode = (nodeType: string) => {
    // Calculate position - in a real app this might be based on the current view
    const position = { x: 100, y: 100 };
    onAddNode(nodeType, position);
  };

  return (
    <Box 
      position="absolute" 
      top="70px" 
      left="10px" 
      zIndex="10" 
      bg="white" 
      p={2} 
      borderRadius="md" 
      boxShadow="md"
      borderWidth="1px"
    >
      <HStack spacing={2}>
        <Tooltip label="Add a node" hasArrow>
          <Button 
            leftIcon={<AddIcon />} 
            size="sm" 
            colorScheme="blue" 
            variant="solid"
          >
            Add Node
          </Button>
        </Tooltip>
        
        {nodeCategories.map((category) => (
          <Menu key={category.name}>
            <MenuButton 
              as={Button} 
              rightIcon={<ChevronDownIcon />} 
              size="sm" 
              variant="outline"
            >
              {category.name}
            </MenuButton>
            <MenuList>
              {category.nodes.map((node, idx) => (
                <MenuItem 
                  key={node.type} 
                  onClick={() => handleAddNode(node.type)}
                  onMouseEnter={() => setHoveredNode(node.type)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <HStack>
                    <Icon as={node.icon} mr={2} />
                    <Text>{node.label}</Text>
                  </HStack>
                  {hoveredNode === node.type && (
                    <Box 
                      position="absolute" 
                      right="-220px" 
                      top="0" 
                      width="200px" 
                      p={2} 
                      bg="gray.50" 
                      borderWidth="1px" 
                      borderRadius="md"
                      shadow="md"
                    >
                      <Text fontSize="sm">{node.description}</Text>
                    </Box>
                  )}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        ))}
      </HStack>
    </Box>
  );
};
