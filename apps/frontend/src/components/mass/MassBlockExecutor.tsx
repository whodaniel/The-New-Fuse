import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Select,
  NumberInput,
  NumberInputField,
  Textarea,
  Switch,
  FormControl,
  FormLabel,
  Icon,
  Divider,
  useToast,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Code,
  Pre
} from '@chakra-ui/react';
import { FiUsers, FiMessageSquare, FiRefreshCw, FiTool, FiZap, FiPlay } from 'react-icons/fi';
import { useMassExecution } from '../../hooks/useMassExecution';
import { MassBlockType } from '@the-new-fuse/types';

interface MassBlockExecutorProps {
  availableAgents: Array<{ id: string; name: string; type: string }>;
  onExecutionComplete?: (result: any) => void;
}

export const MassBlockExecutor: React.FC<MassBlockExecutorProps> = ({
  availableAgents,
  onExecutionComplete
}) => {
  const [selectedBlock, setSelectedBlock] = useState<MassBlockType>('aggregate');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [blockConfig, setBlockConfig] = useState<any>({});
  const [executionResult, setExecutionResult] = useState<any>(null);

  const toast = useToast();
  const { executeAggregate, executeReflect, executeDebate, loading, error } = useMassExecution();

  useEffect(() => {
    if (error) {
      toast({
        title: 'Execution Error',
        description: error,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  }, [error, toast]);

  const blockTypes = [
    {
      type: 'aggregate' as MassBlockType,
      name: 'Aggregate',
      description: 'Parallel execution with result aggregation',
      icon: FiUsers,
      color: 'blue'
    },
    {
      type: 'reflect' as MassBlockType,
      name: 'Reflect',
      description: 'Iterative refinement through reflection',
      icon: FiRefreshCw,
      color: 'green'
    },
    {
      type: 'debate' as MassBlockType,
      name: 'Debate',
      description: 'Multi-agent debate for robust decisions',
      icon: FiMessageSquare,
      color: 'purple'
    },
    {
      type: 'custom' as MassBlockType,
      name: 'Custom',
      description: 'Task-specific custom agents',
      icon: FiZap,
      color: 'orange'
    },
    {
      type: 'tool_use' as MassBlockType,
      name: 'Tool Use',
      description: 'External tool integration',
      icon: FiTool,
      color: 'teal'
    }
  ];

  const handleExecute = async () => {
    if (!input.trim() || selectedAgents.length === 0) {
      toast({
        title: 'Invalid Input',
        description: 'Please provide input and select at least one agent',
        status: 'warning',
        duration: 3000
      });
      return;
    }

    try {
      let result;

      switch (selectedBlock) {
        case 'aggregate':
          result = await executeAggregate(
            selectedAgents,
            input,
            {
              aggregationStrategy: blockConfig.aggregationStrategy || 'majority_vote',
              parallelExecution: blockConfig.parallelExecution !== false
            }
          );
          break;

        case 'reflect':
          if (selectedAgents.length < 2) {
            toast({
              title: 'Insufficient Agents',
              description: 'Reflect block requires at least 2 agents (predictor and reflector)',
              status: 'warning',
              duration: 3000
            });
            return;
          }
          result = await executeReflect(
            selectedAgents[0],
            selectedAgents[1],
            input,
            {
              maxRounds: blockConfig.maxRounds || 3
            }
          );
          break;

        case 'debate':
          if (selectedAgents.length < 2) {
            toast({
              title: 'Insufficient Agents',
              description: 'Debate block requires at least 2 agents',
              status: 'warning',
              duration: 3000
            });
            return;
          }
          result = await executeDebate(
            selectedAgents,
            input,
            {
              debateRounds: blockConfig.debateRounds || 3,
              votingStrategy: blockConfig.votingStrategy || 'majority'
            }
          );
          break;

        default:
          toast({
            title: 'Not Implemented',
            description: `${selectedBlock} block execution not yet implemented`,
            status: 'info',
            duration: 3000
          });
          return;
      }

      setExecutionResult(result);
      onExecutionComplete?.(result);

      toast({
        title: 'Execution Complete',
        description: `${selectedBlock} block executed successfully`,
        status: 'success',
        duration: 3000
      });
    } catch (err) {
      console.error('Execution failed:', err);
    }
  };

  const renderBlockConfiguration = () => {
    switch (selectedBlock) {
      case 'aggregate':
        return (
          <VStack spacing={3}>
            <FormControl>
              <FormLabel fontSize="sm">Aggregation Strategy</FormLabel>
              <Select
                value={blockConfig.aggregationStrategy || 'majority_vote'}
                onChange={(e) => setBlockConfig({ ...blockConfig, aggregationStrategy: e.target.value })}
              >
                <option value="majority_vote">Majority Vote</option>
                <option value="weighted_average">Weighted Average</option>
                <option value="consensus">Consensus</option>
              </Select>
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel fontSize="sm" mb={0}>
                Parallel Execution
              </FormLabel>
              <Switch
                isChecked={blockConfig.parallelExecution !== false}
                onChange={(e) => setBlockConfig({ ...blockConfig, parallelExecution: e.target.checked })}
              />
            </FormControl>
          </VStack>
        );

      case 'reflect':
        return (
          <VStack spacing={3}>
            <FormControl>
              <FormLabel fontSize="sm">Max Rounds</FormLabel>
              <NumberInput
                value={blockConfig.maxRounds || 3}
                onChange={(_, num) => setBlockConfig({ ...blockConfig, maxRounds: num || 3 })}
                min={1}
                max={10}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>

            <Box w="full" p={3} bg="blue.50" borderRadius="md">
              <Text fontSize="sm" color="blue.800">
                💡 First selected agent will be the predictor, second will be the reflector
              </Text>
            </Box>
          </VStack>
        );

      case 'debate':
        return (
          <VStack spacing={3}>
            <FormControl>
              <FormLabel fontSize="sm">Debate Rounds</FormLabel>
              <NumberInput
                value={blockConfig.debateRounds || 3}
                onChange={(_, num) => setBlockConfig({ ...blockConfig, debateRounds: num || 3 })}
                min={1}
                max={10}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Voting Strategy</FormLabel>
              <Select
                value={blockConfig.votingStrategy || 'majority'}
                onChange={(e) => setBlockConfig({ ...blockConfig, votingStrategy: e.target.value })}
              >
                <option value="majority">Majority</option>
                <option value="weighted">Weighted</option>
                <option value="consensus">Consensus</option>
              </Select>
            </FormControl>
          </VStack>
        );

      default:
        return (
          <Box p={3} bg="gray.50" borderRadius="md">
            <Text fontSize="sm" color="gray.600">
              Configuration for {selectedBlock} block coming soon...
            </Text>
          </Box>
        );
    }
  };

  const selectedBlockInfo = blockTypes.find(bt => bt.type === selectedBlock);

  return (
    <Card>
      <CardHeader>
        <HStack>
          <Icon as={FiZap} color="purple.500" />
          <Heading size="md">MASS Block Executor</Heading>
          <Badge colorScheme="purple" variant="subtle">Interactive Testing</Badge>
        </HStack>
      </CardHeader>

      <CardBody>
        <VStack spacing={6}>
          {/* Block Type Selection */}
          <Box w="full">
            <Text mb={3} fontSize="sm" fontWeight="medium">
              Select MASS Building Block
            </Text>
            <VStack spacing={2}>
              {blockTypes.map((blockType) => (
                <Box
                  key={blockType.type}
                  w="full"
                  p={3}
                  borderWidth={2}
                  borderRadius="md"
                  borderColor={selectedBlock === blockType.type ? `${blockType.color}.500` : 'gray.200'}
                  bg={selectedBlock === blockType.type ? `${blockType.color}.50` : 'white'}
                  cursor="pointer"
                  onClick={() => {
                    setSelectedBlock(blockType.type);
                    setBlockConfig({});
                    setExecutionResult(null);
                  }}
                  transition="all 0.2s"
                  _hover={{ borderColor: `${blockType.color}.300` }}
                >
                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={blockType.icon} color={`${blockType.color}.500`} />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium">{blockType.name}</Text>
                        <Text fontSize="sm" color="gray.600">
                          {blockType.description}
                        </Text>
                      </VStack>
                    </HStack>
                    {selectedBlock === blockType.type && (
                      <Badge colorScheme={blockType.color}>Selected</Badge>
                    )}
                  </HStack>
                </Box>
              ))}
            </VStack>
          </Box>

          <Divider />

          {/* Agent Selection */}
          <Box w="full">
            <Text mb={3} fontSize="sm" fontWeight="medium">
              Select Agents ({selectedAgents.length} selected)
            </Text>
            <VStack spacing={2} maxH="200px" overflowY="auto">
              {availableAgents.map((agent) => (
                <Box
                  key={agent.id}
                  w="full"
                  p={3}
                  borderWidth={1}
                  borderRadius="md"
                  borderColor={selectedAgents.includes(agent.id) ? 'blue.500' : 'gray.200'}
                  bg={selectedAgents.includes(agent.id) ? 'blue.50' : 'white'}
                  cursor="pointer"
                  onClick={() => {
                    if (selectedAgents.includes(agent.id)) {
                      setSelectedAgents(selectedAgents.filter(id => id !== agent.id));
                    } else {
                      setSelectedAgents([...selectedAgents, agent.id]);
                    }
                  }}
                >
                  <HStack justify="space-between">
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="medium">{agent.name}</Text>
                      <Text fontSize="sm" color="gray.600">{agent.type}</Text>
                    </VStack>
                    {selectedAgents.includes(agent.id) && (
                      <Badge colorScheme="blue">Selected</Badge>
                    )}
                  </HStack>
                </Box>
              ))}
            </VStack>
          </Box>

          <Divider />

          {/* Block Configuration */}
          {selectedBlockInfo && (
            <Box w="full">
              <HStack mb={3}>
                <Icon as={selectedBlockInfo.icon} color={`${selectedBlockInfo.color}.500`} />
                <Text fontSize="sm" fontWeight="medium">
                  {selectedBlockInfo.name} Configuration
                </Text>
              </HStack>
              {renderBlockConfiguration()}
            </Box>
          )}

          <Divider />

          {/* Input */}
          <Box w="full">
            <Text mb={3} fontSize="sm" fontWeight="medium">
              Input for Processing
            </Text>
            <Textarea
              placeholder="Enter the input that will be processed by the selected agents..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={4}
            />
          </Box>

          {/* Execute Button */}
          <Button
            leftIcon={<FiPlay />}
            colorScheme={selectedBlockInfo?.color || 'blue'}
            size="lg"
            w="full"
            onClick={handleExecute}
            isLoading={loading}
            loadingText="Executing..."
            isDisabled={!input.trim() || selectedAgents.length === 0}
          >
            Execute {selectedBlockInfo?.name} Block
          </Button>

          {/* Execution Results */}
          {executionResult && (
            <Box w="full">
              <Divider mb={4} />
              <Heading size="sm" mb={3}>Execution Results</Heading>
              
              <Accordion allowToggle>
                <AccordionItem>
                  <AccordionButton>
                    <Box flex="1" textAlign="left">
                      <HStack>
                        <Icon as={FiZap} color="green.500" />
                        <Text fontWeight="medium">Final Result</Text>
                        <Badge colorScheme="green">Success</Badge>
                      </HStack>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <Box p={3} bg="gray.50" borderRadius="md">
                      <Pre fontSize="sm" whiteSpace="pre-wrap">
                        {typeof executionResult.result === 'string' 
                          ? executionResult.result 
                          : JSON.stringify(executionResult.result, null, 2)}
                      </Pre>
                    </Box>
                  </AccordionPanel>
                </AccordionItem>

                {executionResult.reflectionHistory && (
                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        <HStack>
                          <Icon as={FiRefreshCw} color="blue.500" />
                          <Text fontWeight="medium">Reflection History</Text>
                          <Badge colorScheme="blue">{executionResult.reflectionHistory.length} rounds</Badge>
                        </HStack>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      <VStack spacing={3} align="stretch">
                        {executionResult.reflectionHistory.map((round: any, index: number) => (
                          <Box key={index} p={3} bg="blue.50" borderRadius="md">
                            <Text fontSize="sm" fontWeight="medium" mb={2}>
                              Round {index + 1}
                            </Text>
                            <Code fontSize="sm" p={2} display="block" whiteSpace="pre-wrap">
                              {JSON.stringify(round, null, 2)}
                            </Code>
                          </Box>
                        ))}
                      </VStack>
                    </AccordionPanel>
                  </AccordionItem>
                )}

                {executionResult.debateHistory && (
                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        <HStack>
                          <Icon as={FiMessageSquare} color="purple.500" />
                          <Text fontWeight="medium">Debate History</Text>
                          <Badge colorScheme="purple">{executionResult.debateHistory.length} rounds</Badge>
                        </HStack>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      <VStack spacing={3} align="stretch">
                        {executionResult.debateHistory.map((round: any, index: number) => (
                          <Box key={index} p={3} bg="purple.50" borderRadius="md">
                            <Text fontSize="sm" fontWeight="medium" mb={2}>
                              Debate Round {index + 1}
                            </Text>
                            <Code fontSize="sm" p={2} display="block" whiteSpace="pre-wrap">
                              {JSON.stringify(round, null, 2)}
                            </Code>
                          </Box>
                        ))}
                      </VStack>
                    </AccordionPanel>
                  </AccordionItem>
                )}

                <AccordionItem>
                  <AccordionButton>
                    <Box flex="1" textAlign="left">
                      <HStack>
                        <Icon as={FiTool} color="orange.500" />
                        <Text fontWeight="medium">Execution Metrics</Text>
                      </HStack>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <Box p={3} bg="orange.50" borderRadius="md">
                      <VStack align="stretch" spacing={2}>
                        {executionResult.executionMetrics && Object.entries(executionResult.executionMetrics).map(([key, value]) => (
                          <HStack key={key} justify="space-between">
                            <Text fontSize="sm" fontWeight="medium">{key}:</Text>
                            <Code fontSize="sm">{String(value)}</Code>
                          </HStack>
                        ))}
                      </VStack>
                    </Box>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </Box>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};
