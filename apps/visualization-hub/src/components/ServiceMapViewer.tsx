import {
  Badge,
  Box,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  Icon,
  SimpleGrid,
  Spinner,
  Text,
  useToast,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FiCheckCircle, FiRefreshCw, FiServer, FiXCircle } from 'react-icons/fi';

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy';
  url: string;
}

export const ServiceMapViewer = () => {
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchMeshHealth = async () => {
    setLoading(true);
    try {
      // Fetch from the new gateway endpoint
      const res = await fetch('/api/system/mesh-health');
      const healthMap = await res.json();

      // Convert map to array for rendering
      const serviceList: ServiceHealth[] = Object.entries(healthMap).map(([name, isHealthy]) => ({
        name,
        status: isHealthy ? 'healthy' : 'unhealthy',
        url: '', // We don't expose URLs to frontend for security
      }));

      setServices(serviceList);
    } catch (error) {
      console.error('Failed to fetch mesh health:', error);
      toast({
        title: 'Mesh Offline',
        description: 'Could not connect to API Gateway health service.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeshHealth();
    const interval = setInterval(fetchMeshHealth, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading && services.length === 0) {
    return (
      <Flex h="600px" align="center" justify="center" direction="column">
        <Spinner size="xl" color="orange.500" mb={4} />
        <Text>Pinging Microservice Mesh...</Text>
      </Flex>
    );
  }

  return (
    <Box
      bg="white"
      p={6}
      borderRadius="xl"
      boxShadow="md"
      border="1px solid"
      borderColor="gray.200"
    >
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="md" color="gray.700">
            Microservice Mesh Map
          </Heading>
          <Text fontSize="sm" color="gray.500">
            Live status of the TNF infrastructure nodes
          </Text>
        </Box>
        <Badge colorScheme="orange" variant="outline" p={2} borderRadius="md">
          {services.filter((s) => s.status === 'healthy').length} / {services.length} Online
        </Badge>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {services.map((service) => (
          <Card
            key={service.name}
            variant="outline"
            borderLeftWidth="4px"
            borderLeftColor={service.status === 'healthy' ? 'green.400' : 'red.400'}
          >
            <CardHeader pb={2}>
              <Flex align="center" gap={3}>
                <Icon as={FiServer} color="gray.400" />
                <Heading size="sm" textTransform="uppercase">
                  {service.name}
                </Heading>
              </Flex>
            </CardHeader>
            <CardBody pt={0}>
              <Flex align="center" gap={2}>
                <Icon
                  as={service.status === 'healthy' ? FiCheckCircle : FiXCircle}
                  color={service.status === 'healthy' ? 'green.500' : 'red.500'}
                />
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color={service.status === 'healthy' ? 'green.600' : 'red.600'}
                >
                  {service.status.toUpperCase()}
                </Text>
              </Flex>
              <Text fontSize="xs" color="gray.400" mt={2}>
                Last heartbeat: {new Date().toLocaleTimeString()}
              </Text>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      <Flex justify="center" mt={8}>
        <Text fontSize="xs" color="gray.400" display="flex" align="center" gap={1}>
          <FiRefreshCw /> Auto-syncing with API Gateway every 30 seconds
        </Text>
      </Flex>
    </Box>
  );
};

export default ServiceMapViewer;
