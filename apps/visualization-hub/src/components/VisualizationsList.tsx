import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Heading,
  Icon,
  Link,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FiExternalLink, FiFileText, FiRefreshCw } from 'react-icons/fi';

interface Visualization {
  id: string;
  name: string;
  type: string;
  timestamp: string;
  url: string;
}

const VisualizationsList = () => {
  const [visualizations, setVisualizations] = useState<Visualization[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVisualizations = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8766/api/visualizations');
      const data = await response.json();
      setVisualizations(data);
    } catch (err) {
      console.error('Failed to fetch visualizations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisualizations();
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
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="md" color="gray.700">
          Generated Visualizations
        </Heading>
        <Button
          leftIcon={<FiRefreshCw />}
          size="sm"
          variant="outline"
          onClick={fetchVisualizations}
          isLoading={loading}
        >
          Refresh
        </Button>
      </Flex>

      {visualizations.length === 0 ? (
        <Flex direction="column" align="center" justify="center" py={10} color="gray.400">
          <Icon as={FiFileText} boxSize={12} mb={4} />
          <Text>No visualizations generated yet.</Text>
          <Text fontSize="sm">AI Agents will appear here once they generate reports.</Text>
        </Flex>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {visualizations.map((viz) => (
            <Card key={viz.id} variant="outline" size="sm">
              <CardBody>
                <Stack spacing={3}>
                  <Flex justify="space-between" align="start">
                    <Box>
                      <Text fontWeight="bold" fontSize="sm">
                        {viz.name}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {new Date(viz.timestamp).toLocaleString()}
                      </Text>
                    </Box>
                    <Badge colorScheme="blue" fontSize="2xs">
                      {viz.type}
                    </Badge>
                  </Flex>
                  <Button
                    as={Link}
                    href={viz.url}
                    isExternal
                    size="xs"
                    rightIcon={<FiExternalLink />}
                    colorScheme="blue"
                    variant="ghost"
                    justifyContent="start"
                    px={0}
                  >
                    View HTML Artifact
                  </Button>
                </Stack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default VisualizationsList;
