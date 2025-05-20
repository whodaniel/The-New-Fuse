import React, { useState, useEffect } from 'react';
import { 
  Box, 
  VStack, 
  Heading, 
  Text, 
  FormControl, 
  FormLabel, 
  Select, 
  Checkbox, 
  CheckboxGroup, 
  SimpleGrid,
  Divider,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  HStack,
  Tag,
  TagLabel,
  TagCloseButton,
  Input,
  Button,
  useColorModeValue
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { useWizard } from '../WizardProvider.js';

export const AIPreferencesStep: React.FC = () => {
  const { state, updateSessionData } = useWizard();
  const isAIAgent = state.session?.userType === 'ai_agent';
  
  // Get existing data from session if available
  const existingData = state.session?.data || {};
  
  // Form state
  const [formData, setFormData] = useState({
    // Common fields
    preferredModels: existingData.preferredModels || ['gpt-4', 'claude-3-opus'],
    
    // Human user specific fields
    temperature: existingData.temperature || 0.7,
    maxTokens: existingData.maxTokens || 4000,
    embeddingModel: existingData.embeddingModel || 'text-embedding-3-large',
    
    // AI agent specific fields
    capabilities: existingData.capabilities || [],
    supportedProtocols: existingData.supportedProtocols || ['http', 'websocket'],
    customCapability: '',
  });
  
  // Update session data when form changes
  useEffect(() => {
    updateSessionData(formData);
  }, [formData, updateSessionData]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSliderChange = (name: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCheckboxChange = (name: string, values: string[]) => {
    setFormData(prev => ({
      ...prev,
      [name]: values
    }));
  };
  
  const handleAddCapability = () => {
    if (formData.customCapability.trim()) {
      setFormData(prev => ({
        ...prev,
        capabilities: [...prev.capabilities, prev.customCapability.trim()],
        customCapability: ''
      }));
    }
  };
  
  const handleRemoveCapability = (capability: string) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.filter(cap => cap !== capability)
    }));
  };
  
  const tagBg = useColorModeValue('blue.100', 'blue.900');

  return (
    <Box>
      <Heading as="h2" size="md" mb={4}>
        {isAIAgent ? 'Agent Capabilities' : 'AI Preferences'}
      </Heading>
      
      <Text mb={6}>
        {isAIAgent 
          ? 'Define the capabilities and protocols your agent supports for integration with The New Fuse.'
          : 'Configure your preferences for AI models and behavior.'}
      </Text>
      
      <VStack spacing={6} align="stretch">
        {isAIAgent ? (
          // AI Agent specific fields
          <>
            <FormControl>
              <FormLabel>Supported Protocols</FormLabel>
              <CheckboxGroup 
                colorScheme="blue" 
                value={formData.supportedProtocols}
                onChange={(values) => handleCheckboxChange('supportedProtocols', values as string[])}
              >
                <SimpleGrid columns={2} spacing={4}>
                  <Checkbox value="http">HTTP/REST</Checkbox>
                  <Checkbox value="websocket">WebSocket</Checkbox>
                  <Checkbox value="grpc">gRPC</Checkbox>
                  <Checkbox value="mqtt">MQTT</Checkbox>
                  <Checkbox value="redis">Redis Pub/Sub</Checkbox>
                  <Checkbox value="kafka">Kafka</Checkbox>
                </SimpleGrid>
              </CheckboxGroup>
            </FormControl>
            
            <Divider />
            
            <FormControl>
              <FormLabel>Agent Capabilities</FormLabel>
              <Text fontSize="sm" color="gray.600" mb={3}>
                Select the capabilities your agent provides:
              </Text>
              
              <CheckboxGroup 
                colorScheme="blue" 
                value={formData.capabilities}
                onChange={(values) => handleCheckboxChange('capabilities', values as string[])}
              >
                <SimpleGrid columns={2} spacing={4} mb={4}>
                  <Checkbox value="text-generation">Text Generation</Checkbox>
                  <Checkbox value="code-generation">Code Generation</Checkbox>
                  <Checkbox value="text-embedding">Text Embedding</Checkbox>
                  <Checkbox value="image-generation">Image Generation</Checkbox>
                  <Checkbox value="text-classification">Text Classification</Checkbox>
                  <Checkbox value="summarization">Summarization</Checkbox>
                  <Checkbox value="translation">Translation</Checkbox>
                  <Checkbox value="question-answering">Question Answering</Checkbox>
                  <Checkbox value="data-analysis">Data Analysis</Checkbox>
                  <Checkbox value="search">Search</Checkbox>
                </SimpleGrid>
              </CheckboxGroup>
              
              <Box mt={4}>
                <FormLabel>Custom Capabilities</FormLabel>
                <HStack>
                  <Input 
                    placeholder="Add custom capability..."
                    value={formData.customCapability}
                    name="customCapability"
                    onChange={handleChange}
                  />
                  <Button 
                    leftIcon={<AddIcon />} 
                    onClick={handleAddCapability}
                    isDisabled={!formData.customCapability.trim()}
                  >
                    Add
                  </Button>
                </HStack>
                
                <Box mt={3}>
                  {formData.capabilities.filter(cap => 
                    !['text-generation', 'code-generation', 'text-embedding', 'image-generation', 
                      'text-classification', 'summarization', 'translation', 'question-answering',
                      'data-analysis', 'search'].includes(cap)
                  ).map(capability => (
                    <Tag 
                      key={capability} 
                      size="md" 
                      borderRadius="full" 
                      variant="solid" 
                      bg={tagBg}
                      color="black"
                      m={1}
                    >
                      <TagLabel>{capability}</TagLabel>
                      <TagCloseButton onClick={() => handleRemoveCapability(capability)} />
                    </Tag>
                  ))}
                </Box>
              </Box>
            </FormControl>
          </>
        ) : (
          // Human user specific fields
          <>
            <FormControl>
              <FormLabel>Preferred AI Models</FormLabel>
              <CheckboxGroup 
                colorScheme="blue" 
                value={formData.preferredModels}
                onChange={(values) => handleCheckboxChange('preferredModels', values as string[])}
              >
                <SimpleGrid columns={2} spacing={4}>
                  <Checkbox value="gpt-4">GPT-4</Checkbox>
                  <Checkbox value="gpt-3.5-turbo">GPT-3.5 Turbo</Checkbox>
                  <Checkbox value="claude-3-opus">Claude 3 Opus</Checkbox>
                  <Checkbox value="claude-3-sonnet">Claude 3 Sonnet</Checkbox>
                  <Checkbox value="llama-3">Llama 3</Checkbox>
                  <Checkbox value="mistral-large">Mistral Large</Checkbox>
                </SimpleGrid>
              </CheckboxGroup>
            </FormControl>
            
            <Divider />
            
            <FormControl>
              <FormLabel>Embedding Model</FormLabel>
              <Select 
                name="embeddingModel"
                value={formData.embeddingModel}
                onChange={handleChange}
              >
                <option value="text-embedding-3-large">OpenAI text-embedding-3-large</option>
                <option value="text-embedding-3-small">OpenAI text-embedding-3-small</option>
                <option value="claude-3-embedding">Claude 3 Embedding</option>
                <option value="voyage-embedding">Voyage Embedding</option>
                <option value="cohere-embed">Cohere Embed</option>
              </Select>
            </FormControl>
            
            <Divider />
            
            <FormControl>
              <FormLabel>Temperature: {formData.temperature}</FormLabel>
              <Slider 
                min={0} 
                max={1} 
                step={0.1} 
                value={formData.temperature}
                onChange={(value) => handleSliderChange('temperature', value)}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
              <HStack justify="space-between" mt={1}>
                <Text fontSize="xs">More Deterministic</Text>
                <Text fontSize="xs">More Creative</Text>
              </HStack>
            </FormControl>
            
            <FormControl>
              <FormLabel>Max Tokens: {formData.maxTokens}</FormLabel>
              <Slider 
                min={1000} 
                max={8000} 
                step={1000} 
                value={formData.maxTokens}
                onChange={(value) => handleSliderChange('maxTokens', value)}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
              <HStack justify="space-between" mt={1}>
                <Text fontSize="xs">Shorter</Text>
                <Text fontSize="xs">Longer</Text>
              </HStack>
            </FormControl>
          </>
        )}
      </VStack>
    </Box>
  );
};
