import React, { useState, useEffect } from 'react';
import { OnboardingAdminService } from '../../../services/onboarding-admin.service.js';
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
  Input,
  Textarea,
  Select,
  Switch,
  Divider,
  useColorModeValue,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormHelperText,
  Code,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Badge,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Spinner,
  Alert,
  AlertIcon,
  FormErrorMessage
} from '@chakra-ui/react';

interface OnboardingAISettingsProps {
  onSave: () => void;
  onChange: () => void;
  hasUnsavedChanges: boolean;
}

export const OnboardingAISettings: React.FC<OnboardingAISettingsProps> = ({
  onSave,
  onChange,
  hasUnsavedChanges
}) => {
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const [settings, setSettings] = useState({
    // RAG Settings
    ragEnabled: true,
    defaultEmbeddingModel: 'text-embedding-3-large',
    vectorDatabaseType: 'pinecone',
    vectorDatabaseConfig: {
      pineconeApiKey: '',
      pineconeEnvironment: '',
      pineconeIndex: 'onboarding-knowledge'
    },

    // LLM Settings
    defaultLLMProvider: 'openai',
    defaultLLMModel: 'gpt-4',
    defaultTemperature: 0.7,
    defaultMaxTokens: 1000,

    // Greeter Agent Settings
    greeterAgentEnabled: true,
    greeterAgentName: 'Fuse Assistant',
    greeterAgentAvatar: '/assets/images/greeter-avatar.png',
    greeterAgentPrompt: 'You are Fuse Assistant, a helpful AI assistant designed to help users get started with The New Fuse platform. Your goal is to be friendly, informative, and guide users through the onboarding process.',
    greeterAgentKnowledgeBase: [
      {
        id: 'kb-1',
        name: 'Platform Overview',
        description: 'General information about The New Fuse platform',
        enabled: true
      },
      {
        id: 'kb-2',
        name: 'Getting Started Guide',
        description: 'Step-by-step guide for new users',
        enabled: true
      },
      {
        id: 'kb-3',
        name: 'FAQ',
        description: 'Frequently asked questions',
        enabled: true
      }
    ],

    // Multimodal Settings
    multimodalEnabled: true,
    supportedModalities: ['text', 'image', 'audio'],
    imageAnalysisModel: 'gpt-4-vision',
    audioTranscriptionModel: 'whisper-large-v3',

    // Advanced Settings
    enableDebugMode: false,
    logUserInteractions: true,
    maxConcurrentRequests: 5,
    requestTimeout: 30,
    fallbackBehavior: 'graceful-degradation'
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch AI settings from API
  useEffect(() => {
    const fetchAISettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await OnboardingAdminService.getAISettings();
        setSettings(data);
      } catch (err) {
        console.error('Error fetching AI settings:', err);
        setError('Failed to load AI settings. Please try again.');
        // Default settings are already set in the initial state
      } finally {
        setIsLoading(false);
      }
    };

    fetchAISettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Handle nested properties
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setSettings({
        ...settings,
        [parent]: {
          ...settings[parent as keyof typeof settings],
          [child]: value
        }
      });
    } else {
      setSettings({
        ...settings,
        [name]: value
      });
    }

    onChange();
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    // Handle nested properties
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setSettings({
        ...settings,
        [parent]: {
          ...settings[parent as keyof typeof settings],
          [child]: checked
        }
      });
    } else {
      setSettings({
        ...settings,
        [name]: checked
      });
    }

    onChange();
  };

  const handleSliderChange = (name: string, value: number) => {
    setSettings({
      ...settings,
      [name]: value
    });

    onChange();
  };

  const handleSaveChanges = async () => {
    try {
      await OnboardingAdminService.updateAISettings(settings);
      onSave();

      toast({
        title: 'Changes saved',
        description: 'AI settings have been saved successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error saving AI settings:', err);

      toast({
        title: 'Error saving changes',
        description: 'There was an error saving your changes. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleToggleKnowledgeBase = (id: string) => {
    setSettings({
      ...settings,
      greeterAgentKnowledgeBase: settings.greeterAgentKnowledgeBase.map(kb =>
        kb.id === id ? {...kb, enabled: !kb.enabled} : kb
      )
    });

    onChange();
  };

  return (
    <Box>
      <Heading size="md" mb={6}>AI Settings for Onboarding</Heading>

      <Text mb={4}>
        Configure the AI capabilities used during the onboarding process, including RAG settings, LLM configuration, and the Greeter Agent behavior.
      </Text>

      {isLoading && (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" mb={4} />
          <Text>Loading AI settings...</Text>
        </Box>
      )}

      {error && !isLoading && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          <Box flex="1">
            <Text fontWeight="bold">Error Loading Settings</Text>
            <Text>{error}</Text>
          </Box>
          <Button
            size="sm"
            colorScheme="red"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Alert>
      )}

      {!isLoading && !error && (
        <Tabs colorScheme="blue" variant="enclosed" mb={6}>
          <TabList>
            <Tab>RAG Settings</Tab>
            <Tab>LLM Settings</Tab>
            <Tab>Greeter Agent</Tab>
            <Tab>Multimodal</Tab>
            <Tab>Advanced</Tab>
          </TabList>

        <TabPanels>
          {/* RAG Settings Tab */}
          <TabPanel>
            <Card borderWidth="1px" borderColor={borderColor} bg={bgColor} boxShadow="sm" mb={4}>
              <CardHeader pb={2}>
                <Heading size="sm">Retrieval Augmented Generation (RAG)</Heading>
              </CardHeader>
              <CardBody pt={0}>
                <FormControl display="flex" alignItems="center" mb={4}>
                  <FormLabel mb="0">Enable RAG</FormLabel>
                  <Switch
                    isChecked={settings.ragEnabled}
                    onChange={(e) => handleSwitchChange('ragEnabled', e.target.checked)}
                  />
                </FormControl>

                <FormControl mb={4}>
                  <FormLabel>Default Embedding Model</FormLabel>
                  <Select
                    name="defaultEmbeddingModel"
                    value={settings.defaultEmbeddingModel}
                    onChange={handleInputChange}
                  >
                    <option value="text-embedding-3-large">OpenAI text-embedding-3-large</option>
                    <option value="text-embedding-3-small">OpenAI text-embedding-3-small</option>
                    <option value="text-embedding-ada-002">OpenAI text-embedding-ada-002</option>
                    <option value="voyage-large-2">Voyage AI voyage-large-2</option>
                    <option value="voyage-code-2">Voyage AI voyage-code-2</option>
                    <option value="cohere-embed-english-v3.0">Cohere embed-english-v3.0</option>
                  </Select>
                  <FormHelperText>
                    The embedding model used to convert text into vector representations
                  </FormHelperText>
                </FormControl>

                <FormControl mb={4}>
                  <FormLabel>Vector Database</FormLabel>
                  <Select
                    name="vectorDatabaseType"
                    value={settings.vectorDatabaseType}
                    onChange={handleInputChange}
                  >
                    <option value="pinecone">Pinecone</option>
                    <option value="qdrant">Qdrant</option>
                    <option value="weaviate">Weaviate</option>
                    <option value="milvus">Milvus</option>
                    <option value="chroma">ChromaDB</option>
                  </Select>
                  <FormHelperText>
                    The vector database used to store and retrieve embeddings
                  </FormHelperText>
                </FormControl>

                <Accordion allowToggle>
                  <AccordionItem border="none">
                    <AccordionButton px={0}>
                      <Box flex="1" textAlign="left">
                        <Text fontWeight="medium">Vector Database Configuration</Text>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4} px={0}>
                      {settings.vectorDatabaseType === 'pinecone' && (
                        <>
                          <FormControl mb={4}>
                            <FormLabel>Pinecone API Key</FormLabel>
                            <Input
                              type="password"
                              name="vectorDatabaseConfig.pineconeApiKey"
                              value={settings.vectorDatabaseConfig.pineconeApiKey}
                              onChange={handleInputChange}
                              placeholder="Enter your Pinecone API key"
                            />
                          </FormControl>

                          <FormControl mb={4}>
                            <FormLabel>Pinecone Environment</FormLabel>
                            <Input
                              name="vectorDatabaseConfig.pineconeEnvironment"
                              value={settings.vectorDatabaseConfig.pineconeEnvironment}
                              onChange={handleInputChange}
                              placeholder="e.g., us-west1-gcp"
                            />
                          </FormControl>

                          <FormControl mb={4}>
                            <FormLabel>Pinecone Index</FormLabel>
                            <Input
                              name="vectorDatabaseConfig.pineconeIndex"
                              value={settings.vectorDatabaseConfig.pineconeIndex}
                              onChange={handleInputChange}
                              placeholder="e.g., onboarding-knowledge"
                            />
                          </FormControl>
                        </>
                      )}

                      {settings.vectorDatabaseType !== 'pinecone' && (
                        <Text color="gray.500">
                          Configuration for {settings.vectorDatabaseType} will be available in a future update.
                        </Text>
                      )}
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </CardBody>
            </Card>
          </TabPanel>

          {/* LLM Settings Tab */}
          <TabPanel>
            <Card borderWidth="1px" borderColor={borderColor} bg={bgColor} boxShadow="sm" mb={4}>
              <CardHeader pb={2}>
                <Heading size="sm">Language Model Settings</Heading>
              </CardHeader>
              <CardBody pt={0}>
                <FormControl mb={4}>
                  <FormLabel>Default LLM Provider</FormLabel>
                  <Select
                    name="defaultLLMProvider"
                    value={settings.defaultLLMProvider}
                    onChange={handleInputChange}
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="google">Google AI</option>
                    <option value="azure">Azure OpenAI</option>
                    <option value="mistral">Mistral AI</option>
                  </Select>
                  <FormHelperText>
                    The default provider for language models
                  </FormHelperText>
                </FormControl>

                <FormControl mb={4}>
                  <FormLabel>Default Model</FormLabel>
                  <Select
                    name="defaultLLMModel"
                    value={settings.defaultLLMModel}
                    onChange={handleInputChange}
                  >
                    {settings.defaultLLMProvider === 'openai' && (
                      <>
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      </>
                    )}

                    {settings.defaultLLMProvider === 'anthropic' && (
                      <>
                        <option value="claude-3-opus">Claude 3 Opus</option>
                        <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                        <option value="claude-3-haiku">Claude 3 Haiku</option>
                      </>
                    )}

                    {settings.defaultLLMProvider === 'google' && (
                      <>
                        <option value="gemini-pro">Gemini Pro</option>
                        <option value="gemini-ultra">Gemini Ultra</option>
                      </>
                    )}

                    {settings.defaultLLMProvider === 'azure' && (
                      <>
                        <option value="gpt-4">Azure GPT-4</option>
                        <option value="gpt-35-turbo">Azure GPT-3.5 Turbo</option>
                      </>
                    )}

                    {settings.defaultLLMProvider === 'mistral' && (
                      <>
                        <option value="mistral-large">Mistral Large</option>
                        <option value="mistral-medium">Mistral Medium</option>
                        <option value="mistral-small">Mistral Small</option>
                      </>
                    )}
                  </Select>
                  <FormHelperText>
                    The default language model to use
                  </FormHelperText>
                </FormControl>

                <FormControl mb={4}>
                  <FormLabel>Default Temperature: {settings.defaultTemperature}</FormLabel>
                  <HStack spacing={4}>
                    <Slider
                      aria-label="temperature-slider"
                      min={0}
                      max={1}
                      step={0.1}
                      value={settings.defaultTemperature}
                      onChange={(val) => handleSliderChange('defaultTemperature', val)}
                      flex="1"
                    >
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                    <NumberInput
                      maxW="100px"
                      value={settings.defaultTemperature}
                      onChange={(_, val) => handleSliderChange('defaultTemperature', val)}
                      step={0.1}
                      min={0}
                      max={1}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </HStack>
                  <FormHelperText>
                    Controls randomness: 0 is deterministic, 1 is more creative
                  </FormHelperText>
                </FormControl>

                <FormControl mb={4}>
                  <FormLabel>Default Max Tokens</FormLabel>
                  <NumberInput
                    value={settings.defaultMaxTokens}
                    onChange={(_, val) => handleSliderChange('defaultMaxTokens', val)}
                    min={100}
                    max={8000}
                    step={100}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <FormHelperText>
                    Maximum number of tokens to generate in responses
                  </FormHelperText>
                </FormControl>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Greeter Agent Tab */}
          <TabPanel>
            <Card borderWidth="1px" borderColor={borderColor} bg={bgColor} boxShadow="sm" mb={4}>
              <CardHeader pb={2}>
                <Heading size="sm">Greeter Agent Configuration</Heading>
              </CardHeader>
              <CardBody pt={0}>
                <FormControl display="flex" alignItems="center" mb={4}>
                  <FormLabel mb="0">Enable Greeter Agent</FormLabel>
                  <Switch
                    isChecked={settings.greeterAgentEnabled}
                    onChange={(e) => handleSwitchChange('greeterAgentEnabled', e.target.checked)}
                  />
                </FormControl>

                <FormControl mb={4}>
                  <FormLabel>Agent Name</FormLabel>
                  <Input
                    name="greeterAgentName"
                    value={settings.greeterAgentName}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl mb={4}>
                  <FormLabel>Agent Avatar URL</FormLabel>
                  <Input
                    name="greeterAgentAvatar"
                    value={settings.greeterAgentAvatar}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl mb={4}>
                  <FormLabel>System Prompt</FormLabel>
                  <Textarea
                    name="greeterAgentPrompt"
                    value={settings.greeterAgentPrompt}
                    onChange={handleInputChange}
                    rows={5}
                  />
                  <FormHelperText>
                    The system prompt that defines the greeter agent's behavior and personality
                  </FormHelperText>
                </FormControl>

                <Heading size="xs" mb={2}>Knowledge Base</Heading>
                <Text fontSize="sm" color="gray.500" mb={2}>
                  Select the knowledge bases that the greeter agent can access
                </Text>

                <VStack align="stretch" spacing={2} mb={4}>
                  {settings.greeterAgentKnowledgeBase.map(kb => (
                    <HStack key={kb.id} justify="space-between" p={2} borderWidth="1px" borderRadius="md">
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium">{kb.name}</Text>
                        <Text fontSize="sm" color="gray.500">{kb.description}</Text>
                      </VStack>
                      <Switch
                        isChecked={kb.enabled}
                        onChange={() => handleToggleKnowledgeBase(kb.id)}
                      />
                    </HStack>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Multimodal Tab */}
          <TabPanel>
            <Card borderWidth="1px" borderColor={borderColor} bg={bgColor} boxShadow="sm" mb={4}>
              <CardHeader pb={2}>
                <Heading size="sm">Multimodal Settings</Heading>
              </CardHeader>
              <CardBody pt={0}>
                <FormControl display="flex" alignItems="center" mb={4}>
                  <FormLabel mb="0">Enable Multimodal Support</FormLabel>
                  <Switch
                    isChecked={settings.multimodalEnabled}
                    onChange={(e) => handleSwitchChange('multimodalEnabled', e.target.checked)}
                  />
                </FormControl>

                <FormControl mb={4}>
                  <FormLabel>Supported Modalities</FormLabel>
                  <HStack spacing={4} wrap="wrap">
                    <Button
                      size="sm"
                      colorScheme={settings.supportedModalities.includes('text') ? 'blue' : 'gray'}
                      onClick={() => {
                        const newModalities = settings.supportedModalities.includes('text')
                          ? settings.supportedModalities.filter(m => m !== 'text')
                          : [...settings.supportedModalities, 'text'];

                        setSettings({
                          ...settings,
                          supportedModalities: newModalities
                        });

                        onChange();
                      }}
                    >
                      Text
                    </Button>
                    <Button
                      size="sm"
                      colorScheme={settings.supportedModalities.includes('image') ? 'blue' : 'gray'}
                      onClick={() => {
                        const newModalities = settings.supportedModalities.includes('image')
                          ? settings.supportedModalities.filter(m => m !== 'image')
                          : [...settings.supportedModalities, 'image'];

                        setSettings({
                          ...settings,
                          supportedModalities: newModalities
                        });

                        onChange();
                      }}
                    >
                      Image
                    </Button>
                    <Button
                      size="sm"
                      colorScheme={settings.supportedModalities.includes('audio') ? 'blue' : 'gray'}
                      onClick={() => {
                        const newModalities = settings.supportedModalities.includes('audio')
                          ? settings.supportedModalities.filter(m => m !== 'audio')
                          : [...settings.supportedModalities, 'audio'];

                        setSettings({
                          ...settings,
                          supportedModalities: newModalities
                        });

                        onChange();
                      }}
                    >
                      Audio
                    </Button>
                    <Button
                      size="sm"
                      colorScheme={settings.supportedModalities.includes('video') ? 'blue' : 'gray'}
                      onClick={() => {
                        const newModalities = settings.supportedModalities.includes('video')
                          ? settings.supportedModalities.filter(m => m !== 'video')
                          : [...settings.supportedModalities, 'video'];

                        setSettings({
                          ...settings,
                          supportedModalities: newModalities
                        });

                        onChange();
                      }}
                    >
                      Video
                    </Button>
                  </HStack>
                </FormControl>

                <FormControl mb={4}>
                  <FormLabel>Image Analysis Model</FormLabel>
                  <Select
                    name="imageAnalysisModel"
                    value={settings.imageAnalysisModel}
                    onChange={handleInputChange}
                    isDisabled={!settings.supportedModalities.includes('image')}
                  >
                    <option value="gpt-4-vision">GPT-4 Vision</option>
                    <option value="claude-3-opus">Claude 3 Opus</option>
                    <option value="gemini-pro-vision">Gemini Pro Vision</option>
                  </Select>
                </FormControl>

                <FormControl mb={4}>
                  <FormLabel>Audio Transcription Model</FormLabel>
                  <Select
                    name="audioTranscriptionModel"
                    value={settings.audioTranscriptionModel}
                    onChange={handleInputChange}
                    isDisabled={!settings.supportedModalities.includes('audio')}
                  >
                    <option value="whisper-large-v3">Whisper Large v3</option>
                    <option value="whisper-medium">Whisper Medium</option>
                    <option value="whisper-small">Whisper Small</option>
                  </Select>
                </FormControl>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Advanced Tab */}
          <TabPanel>
            <Card borderWidth="1px" borderColor={borderColor} bg={bgColor} boxShadow="sm" mb={4}>
              <CardHeader pb={2}>
                <Heading size="sm">Advanced Settings</Heading>
              </CardHeader>
              <CardBody pt={0}>
                <FormControl display="flex" alignItems="center" mb={4}>
                  <FormLabel mb="0">Enable Debug Mode</FormLabel>
                  <Switch
                    isChecked={settings.enableDebugMode}
                    onChange={(e) => handleSwitchChange('enableDebugMode', e.target.checked)}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center" mb={4}>
                  <FormLabel mb="0">Log User Interactions</FormLabel>
                  <Switch
                    isChecked={settings.logUserInteractions}
                    onChange={(e) => handleSwitchChange('logUserInteractions', e.target.checked)}
                  />
                </FormControl>

                <FormControl mb={4}>
                  <FormLabel>Max Concurrent Requests</FormLabel>
                  <NumberInput
                    value={settings.maxConcurrentRequests}
                    onChange={(_, val) => handleSliderChange('maxConcurrentRequests', val)}
                    min={1}
                    max={20}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl mb={4}>
                  <FormLabel>Request Timeout (seconds)</FormLabel>
                  <NumberInput
                    value={settings.requestTimeout}
                    onChange={(_, val) => handleSliderChange('requestTimeout', val)}
                    min={5}
                    max={120}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl mb={4}>
                  <FormLabel>Fallback Behavior</FormLabel>
                  <Select
                    name="fallbackBehavior"
                    value={settings.fallbackBehavior}
                    onChange={handleInputChange}
                  >
                    <option value="graceful-degradation">Graceful Degradation</option>
                    <option value="retry">Retry</option>
                    <option value="error">Show Error</option>
                  </Select>
                  <FormHelperText>
                    How the system should behave when AI services are unavailable
                  </FormHelperText>
                </FormControl>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
      )}

      {!isLoading && (
        <Button
          colorScheme="blue"
          size="lg"
          width="full"
          onClick={handleSaveChanges}
          isDisabled={!hasUnsavedChanges || isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      )}
    </Box>
  );
};
