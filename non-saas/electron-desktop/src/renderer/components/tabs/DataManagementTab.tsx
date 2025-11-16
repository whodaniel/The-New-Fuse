import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  SimpleGrid,
  Progress,
  List,
  ListItem,
  ListIcon,
  Divider,
  useToast
} from '@chakra-ui/react';
import {
  FiDatabase,
  FiTable,
  FiRefreshCw,
  FiPlay,
  FiPause,
  FiActivity,
  FiCheckCircle,
  FiClock,
  FiArrowRight
} from 'react-icons/fi';

interface DatabaseConnection {
  name: string;
  type: 'PostgreSQL' | 'Redis' | 'Vector';
  status: 'connected' | 'disconnected' | 'error';
  host: string;
  port: number;
  tables?: number;
  size?: string;
}

interface FairtableBase {
  id: string;
  name: string;
  tables: number;
  records: number;
  collaborators: number;
  lastModified: string;
  status: 'active' | 'syncing' | 'error';
}

const DataManagementTab: React.FC = () => {
  const [databases, setDatabases] = useState<DatabaseConnection[]>([]);
  const [fairtableBases, setFairtableBases] = useState<FairtableBase[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    loadDataSources();
  }, []);

  const loadDataSources = async () => {
    try {
      setLoading(true);
      
      // Simulate loading data sources
      const mockDatabases: DatabaseConnection[] = [
        {
          name: 'Primary Database',
          type: 'PostgreSQL',
          status: 'connected',
          host: 'localhost',
          port: 5432,
          tables: 24,
          size: '2.3 GB'
        },
        {
          name: 'Cache Layer',
          type: 'Redis',
          status: 'connected',
          host: 'localhost',
          port: 6379,
          size: '458 MB'
        },
        {
          name: 'Vector Store',
          type: 'Vector',
          status: 'connected',
          host: 'localhost',
          port: 6333,
          size: '1.2 GB'
        }
      ];

      const mockFairtables: FairtableBase[] = [
        {
          id: '1',
          name: 'Project Management',
          tables: 3,
          records: 145,
          collaborators: 5,
          lastModified: '2 hours ago',
          status: 'active'
        },
        {
          id: '2',
          name: 'Customer Database',
          tables: 5,
          records: 892,
          collaborators: 3,
          lastModified: '1 day ago',
          status: 'syncing'
        }
      ];

      setDatabases(mockDatabases);
      setFairtableBases(mockFairtables);
    } catch (error) {
      toast({
        title: 'Error loading data sources',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const openFairtable = (baseId: string) => {
    if (window.api) {
      window.api.openUrl(`http://localhost:3000/fairtable?id=${baseId}`);
    }
  };

  const openDatabaseManager = () => {
    if (window.api) {
      window.api.openUrl('http://localhost:3000/data/explorer');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return 'green';
      case 'syncing':
        return 'yellow';
      case 'error':
      case 'disconnected':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return <FiCheckCircle color="green" />;
      case 'syncing':
        return <FiClock color="orange" />;
      case 'error':
      case 'disconnected':
        return <FiActivity color="red" />;
      default:
        return <FiActivity />;
    }
  };

  return (
    <Box p={4}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <VStack align="start" spacing={0}>
            <Text fontSize="lg" fontWeight="bold">
              Data Management
            </Text>
            <Text fontSize="sm" color="gray.600">
              Manage databases, tables, and data sources
            </Text>
          </VStack>
          <Button
            size="sm"
            leftIcon={<FiRefreshCw />}
            onClick={loadDataSources}
            isLoading={loading}
          >
            Refresh
          </Button>
        </HStack>

        {/* Database Connections */}
        <Card>
          <CardHeader>
            <HStack justify="space-between">
              <HStack>
                <FiDatabase />
                <Text fontWeight="bold">Database Connections</Text>
              </HStack>
              <Button size="sm" variant="ghost" onClick={openDatabaseManager}>
                Open Manager <FiArrowRight ml={1} />
              </Button>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={3} align="stretch">
              {databases.map((db, index) => (
                <Card key={index} variant="outline" size="sm">
                  <CardBody>
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <HStack>
                          <Text fontWeight="semibold" fontSize="sm">
                            {db.name}
                          </Text>
                          <Badge size="sm" colorScheme="blue">
                            {db.type}
                          </Badge>
                        </HStack>
                        <Text fontSize="xs" color="gray.600">
                          {db.host}:{db.port}
                        </Text>
                        {(db.tables || db.size) && (
                          <HStack spacing={4} fontSize="xs" color="gray.500">
                            {db.tables && <Text>{db.tables} tables</Text>}
                            {db.size && <Text>{db.size}</Text>}
                          </HStack>
                        )}
                      </VStack>
                      
                      <VStack align="end" spacing={1}>
                        <HStack>
                          {getStatusIcon(db.status)}
                          <Badge colorScheme={getStatusColor(db.status)} size="sm">
                            {db.status}
                          </Badge>
                        </HStack>
                      </VStack>
                    </HStack>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          </CardBody>
        </Card>

        {/* Fairtable Bases */}
        <Card>
          <CardHeader>
            <HStack justify="space-between">
              <HStack>
                <FiTable />
                <Text fontWeight="bold">Fairtable Bases</Text>
              </HStack>
              <Button size="sm" variant="ghost" onClick={() => openFairtable('new')}>
                Create Base <FiArrowRight ml={1} />
              </Button>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={3} align="stretch">
              {fairtableBases.map((base) => (
                <Card 
                  key={base.id} 
                  variant="outline" 
                  size="sm"
                  cursor="pointer"
                  _hover={{ borderColor: 'blue.300' }}
                  onClick={() => openFairtable(base.id)}
                >
                  <CardBody>
                    <VStack spacing={2} align="stretch">
                      <HStack justify="space-between">
                        <VStack align="start" spacing={0}>
                          <HStack>
                            <Text fontWeight="semibold" fontSize="sm">
                              {base.name}
                            </Text>
                            <Badge colorScheme={getStatusColor(base.status)} size="sm">
                              {base.status}
                            </Badge>
                          </HStack>
                          <Text fontSize="xs" color="gray.600">
                            Last modified: {base.lastModified}
                          </Text>
                        </VStack>
                      </HStack>
                      
                      <HStack justify="space-between" fontSize="xs" color="gray.500">
                        <Text>{base.tables} tables</Text>
                        <Text>{base.records} records</Text>
                        <Text>{base.collaborators} collaborators</Text>
                      </HStack>
                      
                      {base.status === 'syncing' && (
                        <Progress size="xs" isIndeterminate colorScheme="yellow" />
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              ))}
              
              {fairtableBases.length === 0 && (
                <Box textAlign="center" py={8} color="gray.500">
                  <FiTable size={32} />
                  <Text mt={2}>No Fairtable bases found</Text>
                  <Button
                    size="sm"
                    mt={2}
                    onClick={() => openFairtable('new')}
                  >
                    Create Your First Base
                  </Button>
                </Box>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Data Pipeline Status */}
        <Card>
          <CardHeader>
            <HStack>
              <FiActivity />
              <Text fontWeight="bold">Data Pipeline Status</Text>
            </HStack>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={2} spacing={4}>
              <VStack align="start" spacing={2}>
                <Text fontSize="sm" fontWeight="semibold">Import Jobs</Text>
                <List spacing={1} fontSize="xs">
                  <ListItem>
                    <ListIcon as={FiCheckCircle} color="green.500" />
                    CSV Import - Completed
                  </ListItem>
                  <ListItem>
                    <ListIcon as={FiClock} color="orange.500" />
                    API Sync - Running
                  </ListItem>
                </List>
              </VStack>
              
              <VStack align="start" spacing={2}>
                <Text fontSize="sm" fontWeight="semibold">Export Jobs</Text>
                <List spacing={1} fontSize="xs">
                  <ListItem>
                    <ListIcon as={FiCheckCircle} color="green.500" />
                    Daily Backup - Completed
                  </ListItem>
                  <ListItem>
                    <ListIcon as={FiClock} color="blue.500" />
                    Analytics Export - Scheduled
                  </ListItem>
                </List>
              </VStack>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <Text fontWeight="bold">Quick Actions</Text>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={2} spacing={3}>
              <Button
                size="sm"
                leftIcon={<FiDatabase />}
                onClick={openDatabaseManager}
                variant="outline"
              >
                Database Explorer
              </Button>
              <Button
                size="sm"
                leftIcon={<FiTable />}
                onClick={() => openFairtable('dashboard')}
                variant="outline"
              >
                Fairtable Dashboard
              </Button>
              <Button
                size="sm"
                leftIcon={<FiRefreshCw />}
                onClick={() => {
                  if (window.api) {
                    window.api.openUrl('http://localhost:3000/data/pipeline');
                  }
                }}
                variant="outline"
              >
                Data Pipeline
              </Button>
              <Button
                size="sm"
                leftIcon={<FiArrowRight />}
                onClick={() => {
                  if (window.api) {
                    window.api.openUrl('http://localhost:3000/data/transfer');
                  }
                }}
                variant="outline"
              >
                Import/Export
              </Button>
            </SimpleGrid>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default DataManagementTab;