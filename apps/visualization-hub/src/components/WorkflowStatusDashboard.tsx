import {
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  Progress,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';

const workflows = [
  {
    id: 'wf-001',
    name: 'Auto-Discovery Pipeline',
    status: 'running',
    progress: 65,
    agent: 'Orchestrator',
    startedAt: '2026-01-31 08:15',
  },
  {
    id: 'wf-002',
    name: 'Codebase Security Audit',
    status: 'completed',
    progress: 100,
    agent: 'Security Bot',
    startedAt: '2026-01-31 07:30',
  },
  {
    id: 'wf-003',
    name: 'Frontend Optimization Loop',
    status: 'running',
    progress: 23,
    agent: 'React Optimizer',
    startedAt: '2026-01-31 08:45',
  },
  {
    id: 'wf-004',
    name: 'Database Schema Sync',
    status: 'pending',
    progress: 0,
    agent: 'Schema Validator',
    startedAt: 'Scheduled',
  },
  {
    id: 'wf-005',
    name: 'Agent Interaction Logging',
    status: 'error',
    progress: 45,
    agent: 'Relay Listener',
    startedAt: '2026-01-31 06:00',
  },
];

const WorkflowStatusDashboard = () => {
  return (
    <Box
      bg="white"
      p={4}
      borderRadius="xl"
      boxShadow="md"
      border="1px solid"
      borderColor="gray.200"
    >
      <Heading size="md" color="gray.700" mb={6}>
        Workflow Monitor
      </Heading>

      <Stack spacing={6}>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Workflow Name</Th>
              <Th>Responsible Agent</Th>
              <Th>Status</Th>
              <Th>Progress</Th>
              <Th>Started At</Th>
            </Tr>
          </Thead>
          <Tbody>
            {workflows.map((wf) => (
              <Tr key={wf.id}>
                <Td fontWeight="medium">{wf.name}</Td>
                <Td>
                  <HStack>
                    <Box boxSize={2} borderRadius="full" bg="blue.400" />
                    <Text>{wf.agent}</Text>
                  </HStack>
                </Td>
                <Td>
                  <Badge
                    colorScheme={
                      wf.status === 'running'
                        ? 'blue'
                        : wf.status === 'completed'
                          ? 'green'
                          : wf.status === 'error'
                            ? 'red'
                            : 'gray'
                    }
                  >
                    {wf.status}
                  </Badge>
                </Td>
                <Td minW="150px">
                  <Flex align="center">
                    <Progress
                      value={wf.progress}
                      size="xs"
                      colorScheme={wf.status === 'error' ? 'red' : 'blue'}
                      borderRadius="full"
                      flex={1}
                      mr={2}
                    />
                    <Text fontSize="xs">{wf.progress}%</Text>
                  </Flex>
                </Td>
                <Td fontSize="xs" color="gray.500">
                  {wf.startedAt}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        <Box bg="blue.50" p={4} borderRadius="md">
          <Heading size="xs" color="blue.700" mb={2}>
            Resource Allocation Summary
          </Heading>
          <HStack spacing={8}>
            <Box>
              <Text fontSize="xs" color="blue.600">
                Active Workflows
              </Text>
              <Text fontSize="xl" fontWeight="bold">
                2
              </Text>
            </Box>
            <Box>
              <Text fontSize="xs" color="blue.600">
                Avg. Completion Time
              </Text>
              <Text fontSize="xl" fontWeight="bold">
                14m 22s
              </Text>
            </Box>
            <Box>
              <Text fontSize="xs" color="blue.600">
                Success Rate
              </Text>
              <Text fontSize="xl" fontWeight="bold">
                94.8%
              </Text>
            </Box>
          </HStack>
        </Box>
      </Stack>
    </Box>
  );
};

export default WorkflowStatusDashboard;
