import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Progress,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Heading,
  useToast,
  Spinner,
  Flex,
  Icon,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  NumberInput,
  NumberInputField
} from '@chakra-ui/react';
import { FiPlay, FiPause, FiRefreshCw, FiTrendingUp, FiZap, FiSettings } from 'react-icons/fi';
import { useMassOptimization } from '../../hooks/useMassOptimization';
import { OptimizationJob, MassOptimizationConfig } from '@the-new-fuse/types';

interface MassOptimizationPanelProps {
  agentId?: string;
  agentIds?: string[];
  topologyId?: string;
  onOptimizationComplete?: (result: any) => void;
}

export const MassOptimizationPanel: React.FC<MassOptimizationPanelProps> = ({
  agentId,
  agentIds,
  topologyId,
  onOptimizationComplete
}) => {
  const [optimizationStage, setOptimizationStage] = useState<'idle' | 'stage1' | 'stage2' | 'stage3' | 'complete'>('idle');
  const [currentJobs, setCurrentJobs] = useState<OptimizationJob[]>([]);
  const [config, setConfig] = useState<MassOptimizationConfig>({
    userId: '',
    validationDatasetId: '',
    maxCandidates: 10,
    optimizationRounds: 3,
    evaluationSampleSize: 20,
    llmConfig: {
      model: 'gpt-4',
      temperature: 0.7
    }
  });

  const toast = useToast();
  const { isOpen: isConfigOpen, onOpen: onConfigOpen, onClose: onConfigClose } = useDisclosure();
  
  const {
    optimizeAgent,
    optimizeTopology,
    optimizeWorkflow,
    runFullOptimization,
    getOptimizationJob,
    getUserOptimizationJobs,
    loading,
    error
  } = useMassOptimization();

  useEffect(() => {
    if (error) {
      toast({
        title: 'Optimization Error',
        description: error,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  }, [error, toast]);

  const handleOptimizeAgent = async () => {
    if (!agentId) return;

    try {
      setOptimizationStage('stage1');
      const result = await optimizeAgent(agentId, config);
      setCurrentJobs([result.job]);
      
      // Poll for completion
      pollJobCompletion([result.job.id]);
    } catch (err) {
      setOptimizationStage('idle');
      toast({
        title: 'Failed to start optimization',
        description: 'Please try again',
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleOptimizeTopology = async () => {
    if (!agentIds || agentIds.length === 0) return;

    try {
      setOptimizationStage('stage2');
      const result = await optimizeTopology(agentIds, config);
      setCurrentJobs([result.job]);
      
      pollJobCompletion([result.job.id]);
    } catch (err) {
      setOptimizationStage('idle');
    }
  };

  const handleOptimizeWorkflow = async () => {
    if (!topologyId) return;

    try {
      setOptimizationStage('stage3');
      const result = await optimizeWorkflow(topologyId, config);
      setCurrentJobs([result.job]);
      
      pollJobCompletion([result.job.id]);
    } catch (err) {
      setOptimizationStage('idle');
    }
  };

  const handleFullOptimization = async () => {
    if (!agentIds || agentIds.length === 0) return;

    try {
      setOptimizationStage('stage1');
      const result = await runFullOptimization(agentIds, config);
      
      // Get initial jobs
      const jobs = await Promise.all(
        result.jobIds.map(id => getOptimizationJob(id))
      );
      setCurrentJobs(jobs);
      
      pollJobCompletion(result.jobIds);
    } catch (err) {
      setOptimizationStage('idle');
    }
  };

  const pollJobCompletion = async (jobIds: string[]) => {
    const pollInterval = setInterval(async () => {
      try {
        const jobs = await Promise.all(
          jobIds.map(id => getOptimizationJob(id))
        );
        
        setCurrentJobs(jobs);
        
        const allCompleted = jobs.every(job => 
          job.status === 'completed' || job.status === 'failed'
        );

        if (allCompleted) {
          clearInterval(pollInterval);
          setOptimizationStage('complete');
          
          const failedJobs = jobs.filter(job => job.status === 'failed');
          
          if (failedJobs.length > 0) {
            toast({
              title: 'Some optimizations failed',
              description: `${failedJobs.length} out of ${jobs.length} jobs failed`,
              status: 'warning',
              duration: 5000
            });
          } else {
            toast({
              title: 'Optimization Complete!',
              description: 'All MASS optimization stages completed successfully',
              status: 'success',
              duration: 5000
            });
            
            onOptimizationComplete?.(jobs);
          }
        } else {
          // Update stage based on job types
          const runningJobs = jobs.filter(job => job.status === 'running');
          if (runningJobs.length > 0) {
            const jobType = runningJobs[0].type;
            if (jobType === 'block_level') setOptimizationStage('stage1');
            else if (jobType === 'topology') setOptimizationStage('stage2');
            else if (jobType === 'workflow_level') setOptimizationStage('stage3');
          }
        }
      } catch (err) {
        clearInterval(pollInterval);
        setOptimizationStage('idle');
      }
    }, 2000);

    // Cleanup after 30 minutes
    setTimeout(() => clearInterval(pollInterval), 30 * 60 * 1000);
  };

  const getStageProgress = () => {
    switch (optimizationStage) {
      case 'stage1': return 33;
      case 'stage2': return 66;
      case 'stage3': return 90;
      case 'complete': return 100;
      default: return 0;
    }
  };

  const getStageDescription = () => {
    switch (optimizationStage) {
      case 'stage1': return 'Optimizing individual agent prompts...';
      case 'stage2': return 'Finding optimal workflow topology...';
      case 'stage3': return 'Fine-tuning workflow-level prompts...';
      case 'complete': return 'Optimization complete!';
      default: return 'Ready to optimize';
    }
  };

  const isOptimizing = optimizationStage !== 'idle' && optimizationStage !== 'complete';

  return (
    <Card>
      <CardHeader>
        <HStack justify="space-between">
          <HStack>
            <Icon as={FiZap} color="orange.500" />
            <Heading size="md">MASS Optimization</Heading>
            <Badge colorScheme="orange" variant="subtle">AI-Powered</Badge>
          </HStack>
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<FiSettings />}
            onClick={onConfigOpen}
            isDisabled={isOptimizing}
          >
            Configure
          </Button>
        </HStack>
      </CardHeader>
      
      <CardBody>
        <VStack spacing={6}>
          {/* Progress Section */}
          <Box w="full">
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm" color="gray.600">
                {getStageDescription()}
              </Text>
              <Text fontSize="sm" fontWeight="medium">
                {getStageProgress()}%
              </Text>
            </HStack>
            <Progress
              value={getStageProgress()}
              colorScheme={optimizationStage === 'complete' ? 'green' : 'orange'}
              size="lg"
              borderRadius="md"
            />
          </Box>

          {/* Stage Indicators */}
          <HStack spacing={4} w="full" justify="center">
            {[
              { stage: 'stage1', label: 'Stage 1: Prompts', icon: FiRefreshCw },
              { stage: 'stage2', label: 'Stage 2: Topology', icon: FiTrendingUp },
              { stage: 'stage3', label: 'Stage 3: Workflow', icon: FiZap }
            ].map(({ stage, label, icon }) => (
              <Tooltip key={stage} label={label}>
                <VStack spacing={1}>
                  <Box
                    p={2}
                    borderRadius="full"
                    bg={optimizationStage === stage ? 'orange.500' : 
                        getStageProgress() > (['stage1', 'stage2', 'stage3'].indexOf(stage) + 1) * 33 - 33 ? 'green.500' : 'gray.200'}
                    color={optimizationStage === stage || 
                           getStageProgress() > (['stage1', 'stage2', 'stage3'].indexOf(stage) + 1) * 33 - 33 ? 'white' : 'gray.500'}
                  >
                    {optimizationStage === stage ? (
                      <Spinner size="sm" />
                    ) : (
                      <Icon as={icon} />
                    )}
                  </Box>
                  <Text fontSize="xs" textAlign="center">
                    {label.split(':')[0]}
                  </Text>
                </VStack>
              </Tooltip>
            ))}
          </HStack>

          {/* Action Buttons */}
          <VStack spacing={3} w="full">
            {agentId && (
              <Button
                leftIcon={<FiPlay />}
                colorScheme="orange"
                size="lg"
                w="full"
                onClick={handleOptimizeAgent}
                isLoading={isOptimizing}
                loadingText="Optimizing..."
                isDisabled={!config.validationDatasetId}
              >
                Optimize Agent Prompts (Stage 1)
              </Button>
            )}

            {agentIds && agentIds.length > 0 && (
              <Button
                leftIcon={<FiTrendingUp />}
                colorScheme="blue"
                size="lg"
                w="full"
                onClick={handleOptimizeTopology}
                isLoading={isOptimizing}
                loadingText="Optimizing..."
                isDisabled={!config.validationDatasetId}
              >
                Optimize Topology (Stage 2)
              </Button>
            )}

            {topologyId && (
              <Button
                leftIcon={<FiZap />}
                colorScheme="purple"
                size="lg"
                w="full"
                onClick={handleOptimizeWorkflow}
                isLoading={isOptimizing}
                loadingText="Optimizing..."
                isDisabled={!config.validationDatasetId}
              >
                Optimize Workflow (Stage 3)
              </Button>
            )}

            {agentIds && agentIds.length > 1 && (
              <Button
                leftIcon={<FiZap />}
                colorScheme="green"
                size="lg"
                w="full"
                onClick={handleFullOptimization}
                isLoading={isOptimizing}
                loadingText="Running Full Optimization..."
                isDisabled={!config.validationDatasetId}
              >
                Run Full MASS Pipeline
              </Button>
            )}
          </VStack>

          {/* Current Jobs Status */}
          {currentJobs.length > 0 && (
            <Box w="full">
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Current Jobs
              </Text>
              <VStack spacing={2}>
                {currentJobs.map((job) => (
                  <Box key={job.id} w="full" p={3} bg="gray.50" borderRadius="md">
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <Text fontSize="sm" fontWeight="medium">
                          {job.type.replace('_', ' ').toUpperCase()}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          ID: {job.id.slice(0, 8)}...
                        </Text>
                      </VStack>
                      <Badge
                        colorScheme={
                          job.status === 'completed' ? 'green' :
                          job.status === 'failed' ? 'red' :
                          job.status === 'running' ? 'orange' : 'gray'
                        }
                      >
                        {job.status}
                      </Badge>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}

          {/* Validation Required Notice */}
          {!config.validationDatasetId && (
            <Box w="full" p={3} bg="yellow.50" borderColor="yellow.200" borderWidth={1} borderRadius="md">
              <Text fontSize="sm" color="yellow.800">
                ⚠️ Please configure a validation dataset to enable MASS optimization
              </Text>
            </Box>
          )}
        </VStack>
      </CardBody>

      {/* Configuration Modal */}
      <Modal isOpen={isConfigOpen} onClose={onConfigClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>MASS Optimization Configuration</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Box w="full">
                <Text mb={2} fontSize="sm" fontWeight="medium">
                  Validation Dataset
                </Text>
                <Select
                  placeholder="Select validation dataset..."
                  value={config.validationDatasetId}
                  onChange={(e) => setConfig({ ...config, validationDatasetId: e.target.value })}
                >
                  <option value="dataset-1">Sample Math Problems</option>
                  <option value="dataset-2">Q&A Test Set</option>
                  <option value="dataset-3">Custom Dataset</option>
                </Select>
              </Box>

              <HStack w="full" spacing={4}>
                <Box flex={1}>
                  <Text mb={2} fontSize="sm" fontWeight="medium">
                    Max Candidates
                  </Text>
                  <NumberInput
                    value={config.maxCandidates}
                    onChange={(_, num) => setConfig({ ...config, maxCandidates: num || 10 })}
                    min={5}
                    max={50}
                  >
                    <NumberInputField />
                  </NumberInput>
                </Box>

                <Box flex={1}>
                  <Text mb={2} fontSize="sm" fontWeight="medium">
                    Optimization Rounds
                  </Text>
                  <NumberInput
                    value={config.optimizationRounds}
                    onChange={(_, num) => setConfig({ ...config, optimizationRounds: num || 3 })}
                    min={1}
                    max={10}
                  >
                    <NumberInputField />
                  </NumberInput>
                </Box>
              </HStack>

              <HStack w="full" spacing={4}>
                <Box flex={1}>
                  <Text mb={2} fontSize="sm" fontWeight="medium">
                    LLM Model
                  </Text>
                  <Select
                    value={config.llmConfig?.model || 'gpt-4'}
                    onChange={(e) => setConfig({
                      ...config,
                      llmConfig: { ...config.llmConfig, model: e.target.value }
                    })}
                  >
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="claude-3">Claude 3</option>
                  </Select>
                </Box>

                <Box flex={1}>
                  <Text mb={2} fontSize="sm" fontWeight="medium">
                    Sample Size
                  </Text>
                  <NumberInput
                    value={config.evaluationSampleSize}
                    onChange={(_, num) => setConfig({ ...config, evaluationSampleSize: num || 20 })}
                    min={5}
                    max={100}
                  >
                    <NumberInputField />
                  </NumberInput>
                </Box>
              </HStack>

              <Flex w="full" justify="flex-end" pt={4}>
                <Button colorScheme="blue" onClick={onConfigClose}>
                  Save Configuration
                </Button>
              </Flex>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Card>
  );
};
