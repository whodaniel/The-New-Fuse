import React, { useState, useEffect } from 'react';
import { OnboardingAdminService } from '../../../services/onboarding-admin.service.js';
import { OnboardingAnalytics } from './OnboardingAnalytics.js';
import {
  Box,
  VStack,
  HStack,
  Button,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Select,
  Divider,
  useColorModeValue,
  Flex,
  Badge,
  IconButton,
  Tooltip,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton
} from '@chakra-ui/react';
import {
  FiRefreshCw,
  FiMaximize2,
  FiMinimize2,
  FiInfo,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';

interface OnboardingWizardPreviewProps {}

export const OnboardingWizardPreview: React.FC<OnboardingWizardPreviewProps> = () => {
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const [userType, setUserType] = useState<'human' | 'ai_agent'>('human');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<{
    status: 'success' | 'warning' | 'error';
    message: string;
    details?: string[];
  } | null>(null);

  // Load the preview
  const handleRefreshPreview = async () => {
    setIsLoading(true);
    setPreviewError(null);
    setValidationResults(null);

    try {
      // Validate configuration before showing preview
      const validationResult = await OnboardingAdminService.validateConfiguration();

      if (validationResult.status === 'error') {
        setPreviewError('Failed to load preview. The onboarding configuration contains errors.');
        setValidationResults(validationResult);
      }
    } catch (err) {
      console.error('Error validating configuration:', err);
      setPreviewError('Failed to load preview. An error occurred while validating the configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    handleRefreshPreview();
  }, []);

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleChangeUserType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUserType(e.target.value as 'human' | 'ai_agent');
    handleRefreshPreview();
  };

  const handleRunValidation = async () => {
    setIsLoading(true);

    try {
      const validationResult = await OnboardingAdminService.validateConfiguration();
      setValidationResults(validationResult);

      toast({
        title: `Validation ${validationResult.status === 'success' ? 'Passed' : 'Completed'}`,
        description: validationResult.message,
        status: validationResult.status,
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error validating configuration:', err);

      toast({
        title: 'Validation Error',
        description: 'An error occurred while validating the configuration.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });

      setValidationResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <HStack justifyContent="space-between" mb={6}>
        <Heading size="md">Onboarding Wizard Preview</Heading>
        <HStack>
          <FormControl maxW="200px">
            <Select
              value={userType}
              onChange={handleChangeUserType}
              size="sm"
              aria-label="Select user type"
            >
              <option value="human">Human User</option>
              <option value="ai_agent">AI Agent</option>
            </Select>
          </FormControl>

          <Tooltip label="Refresh Preview">
            <IconButton
              aria-label="Refresh preview"
              icon={<FiRefreshCw />}
              size="sm"
              onClick={handleRefreshPreview}
              isLoading={isLoading}
            />
          </Tooltip>

          <Tooltip label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            <IconButton
              aria-label="Toggle fullscreen"
              icon={isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
              size="sm"
              onClick={handleToggleFullscreen}
            />
          </Tooltip>
        </HStack>
      </HStack>

      <Text mb={4}>
        Preview how the onboarding wizard will appear to users. You can switch between user types to see different onboarding flows.
      </Text>

      {previewError && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          <AlertTitle mr={2}>Preview Error!</AlertTitle>
          <AlertDescription>{previewError}</AlertDescription>
          <CloseButton
            position="absolute"
            right="8px"
            top="8px"
            onClick={() => setPreviewError(null)}
          />
        </Alert>
      )}

      <Tabs colorScheme="blue" variant="enclosed" mb={6}>
        <TabList>
          <Tab>Preview</Tab>
          <Tab>Validation</Tab>
          <Tab>Analytics</Tab>
        </TabList>

        <TabPanels>
          {/* Preview Tab */}
          <TabPanel p={0} pt={4}>
            <Card
              borderWidth="1px"
              borderColor={borderColor}
              bg={bgColor}
              boxShadow="sm"
              height={isFullscreen ? "calc(100vh - 300px)" : "600px"}
              overflow="hidden"
            >
              <CardBody p={0}>
                {isLoading ? (
                  <Flex justify="center" align="center" height="100%">
                    <VStack>
                      <Spinner size="xl" />
                      <Text>Loading preview...</Text>
                    </VStack>
                  </Flex>
                ) : previewError ? (
                  <Flex justify="center" align="center" height="100%" p={8}>
                    <VStack>
                      <FiAlertCircle size={48} color="red" />
                      <Text color="red.500" fontWeight="bold">
                        Failed to load preview
                      </Text>
                      <Text textAlign="center">
                        Please fix the configuration errors and try again.
                      </Text>
                      <Button
                        mt={4}
                        colorScheme="blue"
                        onClick={handleRefreshPreview}
                      >
                        Try Again
                      </Button>
                    </VStack>
                  </Flex>
                ) : (
                  <Box
                    as="iframe"
                    src={`/preview/onboarding?userType=${userType}`}
                    width="100%"
                    height="100%"
                    border="none"
                    borderRadius="md"
                  />
                )}
              </CardBody>
            </Card>

            <HStack mt={4} spacing={4}>
              <Button
                leftIcon={<FiRefreshCw />}
                onClick={handleRefreshPreview}
                isLoading={isLoading}
              >
                Refresh Preview
              </Button>

              <Button
                colorScheme="blue"
                onClick={() => {
                  window.open(`/preview/onboarding?userType=${userType}`, '_blank');
                }}
              >
                Open in New Tab
              </Button>
            </HStack>
          </TabPanel>

          {/* Validation Tab */}
          <TabPanel>
            <Card borderWidth="1px" borderColor={borderColor} bg={bgColor} boxShadow="sm" mb={4}>
              <CardHeader pb={2}>
                <Heading size="sm">Configuration Validation</Heading>
              </CardHeader>
              <CardBody pt={0}>
                <Text mb={4}>
                  Validate your onboarding configuration to ensure it meets best practices and will work correctly.
                </Text>

                <Button
                  colorScheme="blue"
                  onClick={handleRunValidation}
                  isLoading={isLoading}
                  mb={4}
                >
                  Run Validation
                </Button>

                {validationResults && (
                  <Alert
                    status={validationResults.status}
                    variant="subtle"
                    flexDirection="column"
                    alignItems="flex-start"
                    p={4}
                    borderRadius="md"
                  >
                    <Flex w="100%">
                      <AlertIcon boxSize="24px" mr={2} />
                      <AlertTitle fontSize="lg">
                        {validationResults.message}
                      </AlertTitle>
                    </Flex>

                    {validationResults.details && validationResults.details.length > 0 && (
                      <Box mt={4} ml={8}>
                        <Text fontWeight="bold" mb={2}>Details:</Text>
                        <VStack align="start" spacing={1}>
                          {validationResults.details.map((detail, index) => (
                            <HStack key={index} align="start">
                              <Text>•</Text>
                              <Text>{detail}</Text>
                            </HStack>
                          ))}
                        </VStack>
                      </Box>
                    )}
                  </Alert>
                )}
              </CardBody>
            </Card>

            <Card borderWidth="1px" borderColor={borderColor} bg={bgColor} boxShadow="sm">
              <CardHeader pb={2}>
                <Heading size="sm">Best Practices</Heading>
              </CardHeader>
              <CardBody pt={0}>
                <VStack align="start" spacing={3}>
                  <HStack align="start">
                    <Box color="green.500" mt={1}>
                      <FiCheckCircle />
                    </Box>
                    <Box>
                      <Text fontWeight="medium">Keep it simple</Text>
                      <Text fontSize="sm" color="gray.600">
                        Limit the number of steps to 5-7 for human users and 3-4 for AI agents.
                      </Text>
                    </Box>
                  </HStack>

                  <HStack align="start">
                    <Box color="green.500" mt={1}>
                      <FiCheckCircle />
                    </Box>
                    <Box>
                      <Text fontWeight="medium">Clear instructions</Text>
                      <Text fontSize="sm" color="gray.600">
                        Each step should have clear instructions and purpose.
                      </Text>
                    </Box>
                  </HStack>

                  <HStack align="start">
                    <Box color="green.500" mt={1}>
                      <FiCheckCircle />
                    </Box>
                    <Box>
                      <Text fontWeight="medium">Visual cues</Text>
                      <Text fontSize="sm" color="gray.600">
                        Use images and icons to guide users through the process.
                      </Text>
                    </Box>
                  </HStack>

                  <HStack align="start">
                    <Box color="green.500" mt={1}>
                      <FiCheckCircle />
                    </Box>
                    <Box>
                      <Text fontWeight="medium">Progress indicators</Text>
                      <Text fontSize="sm" color="gray.600">
                        Show users how far they've come and how much is left.
                      </Text>
                    </Box>
                  </HStack>

                  <HStack align="start">
                    <Box color="green.500" mt={1}>
                      <FiCheckCircle />
                    </Box>
                    <Box>
                      <Text fontWeight="medium">Skip options</Text>
                      <Text fontSize="sm" color="gray.600">
                        Allow users to skip non-essential steps.
                      </Text>
                    </Box>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Analytics Tab */}
          <TabPanel>
            <OnboardingAnalytics />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};
