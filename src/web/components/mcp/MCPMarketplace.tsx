import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Input, 
  Button, 
  Card, 
  CardHeader, 
  CardBody, 
  CardFooter,
  Flex,
  Badge,
  Image,
  Grid,
  Select,
  Stack,
  useToast,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Tooltip,
  useColorModeValue,
  Icon
} from '@chakra-ui/react';
import { Search2Icon, DownloadIcon, StarIcon, CheckIcon, InfoIcon } from '@chakra-ui/icons';
import { FaCog, FaCode, FaFileAlt, FaGlobe, FaDatabase, FaTerminal } from 'react-icons/fa';

// MCP Marketplace Server type
interface MCPMarketplaceServer {
  id: string;
  name: string;
  description: string;
  version: string;
  publisher: string;
  category: string;
  rating: number;
  downloads: number;
  lastUpdated: string;
  installCommand: string;
  args: string[];
  capabilities: string[];
  requiresConfiguration: boolean;
  configurationSchema?: {
    type: string;
    required?: string[];
    properties: Record<string, any>;
  };
  env?: Record<string, string>;
}

// MCP Marketplace component
export const MCPMarketplace: React.FC = () => {
  const [servers, setServers] = useState<MCPMarketplaceServer[]>([]);
  const [filteredServers, setFilteredServers] = useState<MCPMarketplaceServer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedServer, setSelectedServer] = useState<MCPMarketplaceServer | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [installedServers, setInstalledServers] = useState<string[]>([]);
  
  const toast = useToast();
  
  // Card background color based on color mode
  const cardBg = useColorModeValue('white', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');
  
  // Load servers from API
  useEffect(() => {
    const fetchServers = async () => {
      try {
        setIsLoading(true);
        // In a real implementation, we would fetch from the API
        // const response = await fetch('/api/mcp-marketplace');
        // const data = await response.json();
        
        // For demonstration, use mock data
        const data = getMockServers();
        setServers(data);
        setFilteredServers(data);
        
        // Extract categories
        const uniqueCategories = ['All', ...new Set(data.map(server => server.category))];
        setCategories(uniqueCategories);
        
        // Get installed servers
        const installed = await getInstalledServers();
        setInstalledServers(installed);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching MCP servers:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch MCP servers from marketplace',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setIsLoading(false);
      }
    };
    
    fetchServers();
  }, [toast]);
  
  // Filter servers when search query or category changes
  useEffect(() => {
    let result = servers;
    
    // Filter by category if not 'All'
    if (selectedCategory !== 'All') {
      result = result.filter(server => server.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(server => 
        server.name.toLowerCase().includes(query) ||
        server.description.toLowerCase().includes(query) ||
        server.publisher.toLowerCase().includes(query) ||
        server.capabilities.some(cap => cap.toLowerCase().includes(query))
      );
    }
    
    setFilteredServers(result);
  }, [searchQuery, selectedCategory, servers]);
  
  // Get icon for a server based on its category
  const getServerIcon = (server: MCPMarketplaceServer) => {
    const category = server.category.toLowerCase();
    
    if (category.includes('development')) {
      return FaCode;
    } else if (category.includes('file')) {
      return FaFileAlt;
    } else if (category.includes('system') || category.includes('shell')) {
      return FaTerminal;
    } else if (category.includes('web') || category.includes('browser')) {
      return FaGlobe;
    } else if (category.includes('database')) {
      return FaDatabase;
    } else {
      return FaCog;
    }
  };
  
  // Handle server installation
  const handleInstallServer = async (server: MCPMarketplaceServer) => {
    try {
      // In a real implementation, this would call the API to install the server
      // await fetch('/api/mcp-marketplace/install', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(server),
      // });
      
      // For demonstration, just simulate installation
      setInstalledServers(prev => [...prev, server.id]);
      
      toast({
        title: 'Server Installed',
        description: `Successfully installed ${server.name}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error installing server:', error);
      toast({
        title: 'Installation Failed',
        description: `Failed to install ${server.name}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Open server details modal
  const openServerDetails = (server: MCPMarketplaceServer) => {
    setSelectedServer(server);
    setIsDetailModalOpen(true);
  };
  
  // Render star rating
  const renderStarRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<StarIcon key={i} color="yellow.400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<StarIcon key={i} color="yellow.400" opacity={0.6} />);
      } else {
        stars.push(<StarIcon key={i} color="gray.300" />);
      }
    }
    
    return (
      <Flex align="center">
        {stars}
        <Text ml={2} fontSize="sm" color="gray.500">
          ({rating.toFixed(1)})
        </Text>
      </Flex>
    );
  };
  
  // Get mock servers for development
  const getMockServers = (): MCPMarketplaceServer[] => {
    return [
      {
        id: 'vscode-mcp-server',
        name: 'VS Code MCP Server',
        description: 'Enables AI agents to interact with Visual Studio Code through the Model Context Protocol',
        version: '1.2.0',
        publisher: 'MCP Foundation',
        category: 'Development Tools',
        rating: 4.8,
        downloads: 12503,
        lastUpdated: '2025-04-01',
        installCommand: 'npx',
        args: ['@modelcontextprotocol/vscode-mcp-server'],
        capabilities: ['Code editing', 'File operations', 'Terminal commands', 'Diagnostics'],
        requiresConfiguration: false
      },
      {
        id: 'filesystem-mcp-server',
        name: 'Filesystem MCP Server',
        description: 'Provides secure filesystem access for AI agents through the Model Context Protocol',
        version: '0.9.5',
        publisher: 'MCP Foundation',
        category: 'File Management',
        rating: 4.6,
        downloads: 8921,
        lastUpdated: '2025-03-15',
        installCommand: 'npx',
        args: ['@modelcontextprotocol/server-filesystem', '--allow-dir', './data'],
        capabilities: ['File read', 'File write', 'Directory listing', 'File search'],
        requiresConfiguration: true,
        configurationSchema: {
          type: 'object',
          required: ['allowedDirectories'],
          properties: {
            allowedDirectories: {
              type: 'string',
              description: 'Comma-separated list of directories to allow access to'
            },
            readOnly: {
              type: 'boolean',
              description: 'Whether to allow only read operations'
            }
          }
        }
      },
      {
        id: 'shell-mcp-server',
        name: 'Shell MCP Server',
        description: 'Provides secure shell command execution for AI agents through MCP',
        version: '0.8.2',
        publisher: 'MCP Community',
        category: 'System Tools',
        rating: 4.3,
        downloads: 6254,
        lastUpdated: '2025-03-10',
        installCommand: 'npx',
        args: ['@modelcontextprotocol/server-shell', '--allow-commands', 'ls,cat,echo'],
        capabilities: ['Command execution', 'Process management'],
        requiresConfiguration: true,
        configurationSchema: {
          type: 'object',
          required: ['allowedCommands'],
          properties: {
            allowedCommands: {
              type: 'string',
              description: 'Comma-separated list of allowed commands'
            },
            timeoutSeconds: {
              type: 'number',
              description: 'Maximum execution time for commands (in seconds)'
            }
          }
        }
      },
      {
        id: 'browser-mcp-server',
        name: 'Browser MCP Server',
        description: 'Allows AI agents to browse and interact with web content through MCP',
        version: '1.0.0',
        publisher: 'Web Agents Inc.',
        category: 'Web',
        rating: 4.5,
        downloads: 7829,
        lastUpdated: '2025-04-10',
        installCommand: 'npx',
        args: ['@modelcontextprotocol/server-browser'],
        capabilities: ['Web browsing', 'HTML parsing', 'Form filling', 'Screenshot capture'],
        requiresConfiguration: false
      },
      {
        id: 'database-mcp-server',
        name: 'Database MCP Server',
        description: 'Provides database access for AI agents through the Model Context Protocol',
        version: '0.7.1',
        publisher: 'Data Solutions',
        category: 'Databases',
        rating: 4.2,
        downloads: 3845,
        lastUpdated: '2025-02-28',
        installCommand: 'npx',
        args: ['@modelcontextprotocol/server-database'],
        capabilities: ['SQL query execution', 'Schema inspection', 'Result formatting'],
        requiresConfiguration: true,
        configurationSchema: {
          type: 'object',
          required: ['connectionString', 'databaseType'],
          properties: {
            connectionString: {
              type: 'string',
              description: 'Database connection string'
            },
            databaseType: {
              type: 'string',
              description: 'Type of database (mysql, postgres, sqlite)'
            },
            maxRows: {
              type: 'number',
              description: 'Maximum number of rows to return'
            }
          }
        }
      },
      {
        id: 'code-as-mcp-server',
        name: 'VSCode as MCP Server',
        description: 'Turns your VSCode into an MCP server, enabling advanced coding assistance from MCP clients',
        version: '1.0.2',
        publisher: 'acomagu',
        category: 'Development Tools',
        rating: 4.9,
        downloads: 322,
        lastUpdated: '2025-04-15',
        installCommand: 'npx',
        args: ['vscode-as-mcp-server'],
        capabilities: ['Code editing', 'Terminal operations', 'Preview tools', 'Multi-instance switching'],
        requiresConfiguration: false
      }
    ];
  };
  
  // Get installed servers (would fetch from API in real implementation)
  const getInstalledServers = async (): Promise<string[]> => {
    // In a real implementation, this would fetch from the API
    // const response = await fetch('/api/mcp/installed-servers');
    // const data = await response.json();
    // return data.installedServerIds;
    
    // For demonstration, return mock data
    return ['vscode-mcp-server'];
  };
  
  return (
    <Box>
      <Flex
        mb={6}
        direction={{ base: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ base: 'flex-start', md: 'center' }}
        gap={4}
      >
        <Heading size="lg">MCP Server Marketplace</Heading>
        
        <Flex width={{ base: '100%', md: 'auto' }} gap={4}>
          <Select
            width={{ base: '100%', md: '200px' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
          
          <Flex flex={1} position="relative">
            <Input
              placeholder="Search MCP servers"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              pr="40px"
            />
            <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)">
              <Search2Icon color="gray.500" />
            </Box>
          </Flex>
        </Flex>
      </Flex>
      
      {isLoading ? (
        <Flex justify="center" align="center" height="300px">
          <Text>Loading MCP servers...</Text>
        </Flex>
      ) : filteredServers.length === 0 ? (
        <Box p={8} textAlign="center" borderWidth="1px" borderRadius="lg">
          <Heading size="md" mb={4}>No MCP servers found</Heading>
          <Text>Try adjusting your search or category filter.</Text>
        </Box>
      ) : (
        <Grid 
          templateColumns={{ 
            base: "repeat(1, 1fr)", 
            md: "repeat(2, 1fr)", 
            lg: "repeat(3, 1fr)" 
          }}
          gap={6}
        >
          {filteredServers.map((server) => (
            <Card 
              key={server.id} 
              borderWidth="1px" 
              borderRadius="lg" 
              overflow="hidden"
              bg={cardBg}
              transition="all 0.3s"
              _hover={{ transform: 'translateY(-4px)', boxShadow: 'lg', bg: hoverBg }}
              cursor="pointer"
              onClick={() => openServerDetails(server)}
            >
              <CardHeader pb={2}>
                <Flex justify="space-between" align="center">
                  <Flex align="center" gap={2}>
                    <Icon as={getServerIcon(server)} boxSize={6} />
                    <Heading size="md">{server.name}</Heading>
                  </Flex>
                  <Badge colorScheme="blue" fontSize="0.8em" variant="subtle">
                    v{server.version}
                  </Badge>
                </Flex>
              </CardHeader>
              
              <CardBody py={2}>
                <Text noOfLines={2} mb={2}>
                  {server.description}
                </Text>
                
                <Flex justify="space-between" align="center" mt={2}>
                  <Text fontSize="sm" color="gray.500">
                    By {server.publisher}
                  </Text>
                  {renderStarRating(server.rating)}
                </Flex>
                
                <Flex mt={3} flexWrap="wrap" gap={2}>
                  {server.capabilities.slice(0, 3).map((capability, i) => (
                    <Badge key={i} colorScheme="teal" variant="subtle">
                      {capability}
                    </Badge>
                  ))}
                  {server.capabilities.length > 3 && (
                    <Badge colorScheme="gray" variant="subtle">
                      +{server.capabilities.length - 3} more
                    </Badge>
                  )}
                </Flex>
              </CardBody>
              
              <CardFooter pt={0}>
                <Flex width="100%" justify="space-between" align="center">
                  <Text fontSize="sm" color="gray.500">
                    {server.downloads.toLocaleString()} downloads
                  </Text>
                  
                  <Button
                    rightIcon={installedServers.includes(server.id) ? <CheckIcon /> : <DownloadIcon />}
                    colorScheme={installedServers.includes(server.id) ? "green" : "blue"}
                    size="sm"
                    variant={installedServers.includes(server.id) ? "outline" : "solid"}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!installedServers.includes(server.id)) {
                        handleInstallServer(server);
                      }
                    }}
                  >
                    {installedServers.includes(server.id) ? "Installed" : "Install"}
                  </Button>
                </Flex>
              </CardFooter>
            </Card>
          ))}
        </Grid>
      )}
      
      {/* Server Details Modal */}
      {selectedServer && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          size="xl"
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <Flex align="center" gap={2}>
                <Icon as={getServerIcon(selectedServer)} boxSize={6} />
                {selectedServer.name}
                <Badge colorScheme="blue" ml={2}>v{selectedServer.version}</Badge>
              </Flex>
            </ModalHeader>
            <ModalCloseButton />
            
            <ModalBody>
              <Tabs isFitted variant="enclosed">
                <TabList mb="1em">
                  <Tab>Details</Tab>
                  <Tab>Configuration</Tab>
                  <Tab>Installation</Tab>
                </TabList>
                
                <TabPanels>
                  {/* Details Tab */}
                  <TabPanel>
                    <Stack spacing={4}>
                      <Text>{selectedServer.description}</Text>
                      
                      <Box>
                        <Text fontWeight="bold">Publisher:</Text>
                        <Text>{selectedServer.publisher}</Text>
                      </Box>
                      
                      <Box>
                        <Text fontWeight="bold">Category:</Text>
                        <Text>{selectedServer.category}</Text>
                      </Box>
                      
                      <Box>
                        <Text fontWeight="bold">Rating:</Text>
                        <Flex align="center">
                          {renderStarRating(selectedServer.rating)}
                          <Text ml={2}>({selectedServer.downloads.toLocaleString()} downloads)</Text>
                        </Flex>
                      </Box>
                      
                      <Box>
                        <Text fontWeight="bold">Last Updated:</Text>
                        <Text>{selectedServer.lastUpdated}</Text>
                      </Box>
                      
                      <Box>
                        <Text fontWeight="bold">Capabilities:</Text>
                        <Flex mt={2} flexWrap="wrap" gap={2}>
                          {selectedServer.capabilities.map((capability, i) => (
                            <Badge key={i} colorScheme="teal">
                              {capability}
                            </Badge>
                          ))}
                        </Flex>
                      </Box>
                    </Stack>
                  </TabPanel>
                  
                  {/* Configuration Tab */}
                  <TabPanel>
                    {selectedServer.requiresConfiguration ? (
                      <Stack spacing={4}>
                        <Text>This MCP server requires configuration before use.</Text>
                        
                        {selectedServer.configurationSchema && (
                          <>
                            <Text fontWeight="bold">Configuration Schema:</Text>
                            
                            {Object.entries(selectedServer.configurationSchema.properties).map(([key, prop]) => (
                              <Box key={key} p={3} borderWidth="1px" borderRadius="md">
                                <Flex align="center">
                                  <Text fontWeight="bold">{key}</Text>
                                  {selectedServer.configurationSchema?.required?.includes(key) && (
                                    <Badge colorScheme="red" ml={2}>Required</Badge>
                                  )}
                                </Flex>
                                <Text fontSize="sm" mt={1}>{prop.description}</Text>
                                <Text fontSize="sm" color="gray.500" mt={1}>Type: {prop.type}</Text>
                              </Box>
                            ))}
                          </>
                        )}
                      </Stack>
                    ) : (
                      <Box p={4} borderWidth="1px" borderRadius="md" bg="green.50">
                        <Flex>
                          <CheckIcon color="green.500" mr={2} />
                          <Text>This MCP server works with the default configuration.</Text>
                        </Flex>
                      </Box>
                    )}
                  </TabPanel>
                  
                  {/* Installation Tab */}
                  <TabPanel>
                    <Stack spacing={4}>
                      <Text>To install this MCP server, you can either:</Text>
                      
                      <Box p={4} borderWidth="1px" borderRadius="md">
                        <Text fontWeight="bold" mb={2}>1. Use the Install button:</Text>
                        <Button
                          rightIcon={installedServers.includes(selectedServer.id) ? <CheckIcon /> : <DownloadIcon />}
                          colorScheme={installedServers.includes(selectedServer.id) ? "green" : "blue"}
                          isDisabled={installedServers.includes(selectedServer.id)}
                          onClick={() => handleInstallServer(selectedServer)}
                        >
                          {installedServers.includes(selectedServer.id) ? "Already Installed" : "Install Server"}
                        </Button>
                      </Box>
                      
                      <Box p={4} borderWidth="1px" borderRadius="md">
                        <Text fontWeight="bold" mb={2}>2. Run this command in your terminal:</Text>
                        <Code>
                          {`${selectedServer.installCommand} ${selectedServer.args.join(' ')}`}
                        </Code>
                      </Box>
                    </Stack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </ModalBody>
            
            <ModalFooter>
              <Button mr={3} onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
              
              {!installedServers.includes(selectedServer.id) && (
                <Button 
                  colorScheme="blue" 
                  onClick={() => handleInstallServer(selectedServer)}
                  rightIcon={<DownloadIcon />}
                >
                  Install
                </Button>
              )}
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
};

// Simple code component
const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box
      p={3}
      bg="gray.100"
      borderRadius="md"
      fontFamily="monospace"
      fontSize="sm"
      overflowX="auto"
    >
      {children}
    </Box>
  );
};

export default MCPMarketplace;