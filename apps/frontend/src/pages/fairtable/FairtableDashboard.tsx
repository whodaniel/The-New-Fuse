import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Flex, 
  Heading, 
  Button, 
  VStack, 
  HStack,
  Text,
  Badge,
  Card,
  CardHeader,
  CardBody,
  SimpleGrid,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Spinner
} from '@chakra-ui/react';
import { 
  FiPlus, 
  FiGrid, 
  FiColumns, 
  FiCalendar, 
  FiMoreVertical,
  FiDatabase,
  FiUsers,
  FiTrendingUp,
  FiActivity
} from 'react-icons/fi';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
// TODO: Import when packages are properly configured
// import { GridView, KanbanView, TableView } from '@the-new-fuse/fairtable-components';
// import { formulaEvaluator } from '@the-new-fuse/fairtable-core';

interface Table {
  id: string;
  name: string;
  description: string;
  recordCount: number;
  lastModified: string;
  collaborators: number;
  viewType: 'grid' | 'kanban' | 'timeline';
  status: 'active' | 'archived' | 'draft';
}

const FairtableDashboard: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'grid' | 'kanban' | 'timeline'>('grid');
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual API integration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockTables: Table[] = [
        {
          id: '1',
          name: 'Project Management',
          description: 'Track all development projects and their status',
          recordCount: 45,
          lastModified: '2024-01-15',
          collaborators: 5,
          viewType: 'kanban',
          status: 'active'
        },
        {
          id: '2',
          name: 'Customer Database',
          description: 'Comprehensive customer information and interactions',
          recordCount: 234,
          lastModified: '2024-01-14',
          collaborators: 3,
          viewType: 'grid',
          status: 'active'
        },
        {
          id: '3',
          name: 'Content Calendar',
          description: 'Editorial calendar for content planning and scheduling',
          recordCount: 67,
          lastModified: '2024-01-13',
          collaborators: 4,
          viewType: 'timeline',
          status: 'active'
        },
        {
          id: '4',
          name: 'Inventory Tracking',
          description: 'Product inventory and stock management',
          recordCount: 89,
          lastModified: '2024-01-12',
          collaborators: 2,
          viewType: 'grid',
          status: 'draft'
        }
      ];
      
      setTables(mockTables);
    } catch (error) {
      toast({
        title: 'Error loading tables',
        description: 'Failed to load Fairtable data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewTable = () => {
    toast({
      title: 'Create New Table',
      description: 'Table creation functionality will be implemented soon',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const openTable = (table: Table) => {
    const route = `/fairtable/${table.viewType}?id=${table.id}`;
    navigate(route);
  };

  const getViewIcon = (viewType: string) => {
    switch (viewType) {
      case 'grid': return <FiGrid />;
      case 'kanban': return <FiColumns />;
      case 'timeline': return <FiCalendar />;
      default: return <FiGrid />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'draft': return 'yellow';
      case 'archived': return 'gray';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="50vh">
        <VStack>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading Fairtable Dashboard...</Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <VStack align="start" spacing={1}>
          <Heading size="lg" color="gray.800">
            Fairtable Dashboard
          </Heading>
          <Text color="gray.600">
            Manage your databases, tables, and collaborative workspaces
          </Text>
        </VStack>
        
        <HStack>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={createNewTable}
          >
            Create Table
          </Button>
        </HStack>
      </Flex>

      {/* Statistics Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6} mb={8}>
        <Card>
          <CardBody>
            <HStack>
              <Box
                p={3}
                bg="blue.100"
                borderRadius="lg"
                color="blue.600"
              >
                <FiDatabase size="24" />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="2xl" fontWeight="bold">
                  {tables.length}
                </Text>
                <Text color="gray.600" fontSize="sm">
                  Active Tables
                </Text>
              </VStack>
            </HStack>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <HStack>
              <Box
                p={3}
                bg="green.100"
                borderRadius="lg"
                color="green.600"
              >
                <FiActivity size="24" />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="2xl" fontWeight="bold">
                  {tables.reduce((sum, table) => sum + table.recordCount, 0)}
                </Text>
                <Text color="gray.600" fontSize="sm">
                  Total Records
                </Text>
              </VStack>
            </HStack>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <HStack>
              <Box
                p={3}
                bg="purple.100"
                borderRadius="lg"
                color="purple.600"
              >
                <FiUsers size="24" />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="2xl" fontWeight="bold">
                  {tables.reduce((sum, table) => sum + table.collaborators, 0)}
                </Text>
                <Text color="gray.600" fontSize="sm">
                  Collaborators
                </Text>
              </VStack>
            </HStack>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <HStack>
              <Box
                p={3}
                bg="orange.100"
                borderRadius="lg"
                color="orange.600"
              >
                <FiTrendingUp size="24" />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="2xl" fontWeight="bold">
                  94%
                </Text>
                <Text color="gray.600" fontSize="sm">
                  Uptime
                </Text>
              </VStack>
            </HStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Tables Grid */}
      <Box>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md" color="gray.700">
            Your Tables
          </Heading>
          <HStack>
            <Text fontSize="sm" color="gray.500">
              View as:
            </Text>
            <HStack spacing={1}>
              <IconButton
                aria-label="Grid view"
                icon={<FiGrid />}
                size="sm"
                variant={selectedView === 'grid' ? 'solid' : 'ghost'}
                colorScheme="blue"
                onClick={() => setSelectedView('grid')}
              />
              <IconButton
                aria-label="Kanban view"
                icon={<FiColumns />}
                size="sm"
                variant={selectedView === 'kanban' ? 'solid' : 'ghost'}
                colorScheme="blue"
                onClick={() => setSelectedView('kanban')}
              />
              <IconButton
                aria-label="Timeline view"
                icon={<FiCalendar />}
                size="sm"
                variant={selectedView === 'timeline' ? 'solid' : 'ghost'}
                colorScheme="blue"
                onClick={() => setSelectedView('timeline')}
              />
            </HStack>
          </HStack>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
          {tables.map((table) => (
            <Card 
              key={table.id} 
              cursor="pointer" 
              _hover={{ 
                transform: 'translateY(-2px)', 
                boxShadow: 'lg',
                borderColor: 'blue.200'
              }}
              transition="all 0.2s"
              onClick={() => openTable(table)}
            >
              <CardHeader pb={2}>
                <Flex justify="space-between" align="start">
                  <VStack align="start" spacing={1} flex={1}>
                    <HStack>
                      <Text fontWeight="semibold" fontSize="lg">
                        {table.name}
                      </Text>
                      <Badge 
                        colorScheme={getStatusColor(table.status)}
                        size="sm"
                      >
                        {table.status}
                      </Badge>
                    </HStack>
                    <Text color="gray.600" fontSize="sm">
                      {table.description}
                    </Text>
                  </VStack>
                  
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      aria-label="Options"
                      icon={<FiMoreVertical />}
                      variant="ghost"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <MenuList>
                      <MenuItem onClick={(e) => e.stopPropagation()}>
                        Edit Table
                      </MenuItem>
                      <MenuItem onClick={(e) => e.stopPropagation()}>
                        Duplicate
                      </MenuItem>
                      <MenuItem onClick={(e) => e.stopPropagation()}>
                        Export Data
                      </MenuItem>
                      <MenuItem 
                        onClick={(e) => e.stopPropagation()}
                        color="red.500"
                      >
                        Delete Table
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Flex>
              </CardHeader>

              <CardBody pt={2}>
                <VStack align="start" spacing={3}>
                  <HStack justify="space-between" w="full">
                    <HStack>
                      <Box color="blue.500">
                        {getViewIcon(table.viewType)}
                      </Box>
                      <Text fontSize="sm" color="gray.600" textTransform="capitalize">
                        {table.viewType} View
                      </Text>
                    </HStack>
                    <Text fontSize="sm" color="gray.500">
                      {table.recordCount} records
                    </Text>
                  </HStack>

                  <HStack justify="space-between" w="full">
                    <HStack>
                      <FiUsers size="14" />
                      <Text fontSize="sm" color="gray.600">
                        {table.collaborators} collaborators
                      </Text>
                    </HStack>
                    <Text fontSize="sm" color="gray.500">
                      Updated {table.lastModified}
                    </Text>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </Box>

      {tables.length === 0 && (
        <Card>
          <CardBody>
            <VStack py={8} spacing={4}>
              <FiDatabase size="48" color="gray.300" />
              <Text color="gray.500" textAlign="center">
                No tables found. Create your first table to get started.
              </Text>
              <Button 
                colorScheme="blue" 
                leftIcon={<FiPlus />}
                onClick={createNewTable}
              >
                Create Your First Table
              </Button>
            </VStack>
          </CardBody>
        </Card>
      )}
    </Box>
  );
};

export default FairtableDashboard;