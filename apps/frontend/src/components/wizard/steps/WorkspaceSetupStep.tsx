import React, { useState, useEffect } from 'react';
import { 
  Box, 
  VStack, 
  Heading, 
  Text, 
  FormControl, 
  FormLabel, 
  Input, 
  Select, 
  Textarea,
  FormHelperText,
  FormErrorMessage,
  RadioGroup,
  Radio,
  Stack,
  Switch,
  HStack,
  Divider,
  Button,
  useToast
} from '@chakra-ui/react';
import { useWizard } from '../WizardProvider.js';

export const WorkspaceSetupStep: React.FC = () => {
  const { state, updateSessionData } = useWizard();
  const isAIAgent = state.session?.userType === 'ai_agent';
  const toast = useToast();
  
  // Get existing data from session if available
  const existingData = state.session?.data || {};
  
  // Form state
  const [formData, setFormData] = useState({
    // Common fields
    name: existingData.workspaceName || '',
    description: existingData.workspaceDescription || '',
    
    // Human user specific fields
    visibility: existingData.workspaceVisibility || 'private',
    template: existingData.workspaceTemplate || 'blank',
    enableCollaboration: existingData.enableCollaboration || false,
    
    // AI agent specific fields
    endpointUrl: existingData.endpointUrl || '',
    authType: existingData.authType || 'api_key',
    apiKey: existingData.apiKey || '',
    webhookUrl: existingData.webhookUrl || '',
    maxConcurrentRequests: existingData.maxConcurrentRequests || '10'
  });
  
  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Update session data when form changes
  useEffect(() => {
    updateSessionData({
      workspaceName: formData.name,
      workspaceDescription: formData.description,
      workspaceVisibility: formData.visibility,
      workspaceTemplate: formData.template,
      enableCollaboration: formData.enableCollaboration,
      endpointUrl: formData.endpointUrl,
      authType: formData.authType,
      apiKey: formData.apiKey,
      webhookUrl: formData.webhookUrl,
      maxConcurrentRequests: formData.maxConcurrentRequests
    });
  }, [formData, updateSessionData]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const handleRadioChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Validate required fields
  const validateField = (name: string, value: string) => {
    if (!value.trim()) {
      setErrors(prev => ({
        ...prev,
        [name]: 'This field is required'
      }));
      return false;
    }
    return true;
  };
  
  // Validate URL format
  const validateUrl = (name: string, url: string) => {
    if (!url.trim()) {
      return true; // URL is optional
    }
    
    try {
      new URL(url);
      return true;
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        [name]: 'Please enter a valid URL'
      }));
      return false;
    }
  };
  
  // Validate form on blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'name') {
      validateField(name, value);
    } else if (name === 'endpointUrl' || name === 'webhookUrl') {
      validateUrl(name, value);
    }
  };
  
  const handleTestConnection = () => {
    // In a real implementation, this would test the connection to the agent's endpoint
    toast({
      title: 'Connection test',
      description: 'Connection successful! Your agent is properly configured.',
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
  };

  return (
    <Box>
      <Heading as="h2" size="md" mb={4}>
        {isAIAgent ? 'Integration Setup' : 'Workspace Setup'}
      </Heading>
      
      <Text mb={6}>
        {isAIAgent 
          ? 'Configure how your agent will communicate with The New Fuse platform.'
          : 'Create your first workspace to organize your projects and collaborations.'}
      </Text>
      
      <VStack spacing={6} align="stretch">
        <FormControl isRequired isInvalid={!!errors.name}>
          <FormLabel>{isAIAgent ? 'Integration Name' : 'Workspace Name'}</FormLabel>
          <Input 
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={isAIAgent ? 'e.g., Claude Integration' : 'e.g., My First Workspace'}
          />
          {errors.name && <FormErrorMessage>{errors.name}</FormErrorMessage>}
        </FormControl>
        
        <FormControl>
          <FormLabel>{isAIAgent ? 'Integration Description' : 'Workspace Description'}</FormLabel>
          <Textarea 
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder={isAIAgent 
              ? 'Describe how this integration will be used...'
              : 'Describe the purpose of this workspace...'}
            rows={3}
          />
        </FormControl>
        
        {isAIAgent ? (
          // AI Agent specific fields
          <>
            <Divider />
            
            <FormControl isInvalid={!!errors.endpointUrl}>
              <FormLabel>API Endpoint URL</FormLabel>
              <Input 
                name="endpointUrl"
                value={formData.endpointUrl}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g., https://api.youragent.com/v1"
              />
              {errors.endpointUrl && <FormErrorMessage>{errors.endpointUrl}</FormErrorMessage>}
              <FormHelperText>The URL where The New Fuse can send requests to your agent</FormHelperText>
            </FormControl>
            
            <FormControl>
              <FormLabel>Authentication Type</FormLabel>
              <RadioGroup 
                value={formData.authType}
                onChange={(value) => handleRadioChange('authType', value)}
              >
                <Stack direction="column" spacing={3}>
                  <Radio value="api_key">API Key</Radio>
                  <Radio value="oauth">OAuth 2.0</Radio>
                  <Radio value="jwt">JWT</Radio>
                  <Radio value="none">No Authentication</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
            
            {formData.authType === 'api_key' && (
              <FormControl>
                <FormLabel>API Key</FormLabel>
                <Input 
                  name="apiKey"
                  type="password"
                  value={formData.apiKey}
                  onChange={handleChange}
                  placeholder="Enter your API key"
                />
                <FormHelperText>This will be stored securely and used for authentication</FormHelperText>
              </FormControl>
            )}
            
            <FormControl isInvalid={!!errors.webhookUrl}>
              <FormLabel>Webhook URL (Optional)</FormLabel>
              <Input 
                name="webhookUrl"
                value={formData.webhookUrl}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g., https://youragent.com/webhook"
              />
              {errors.webhookUrl && <FormErrorMessage>{errors.webhookUrl}</FormErrorMessage>}
              <FormHelperText>URL for receiving asynchronous notifications</FormHelperText>
            </FormControl>
            
            <FormControl>
              <FormLabel>Max Concurrent Requests</FormLabel>
              <Select 
                name="maxConcurrentRequests"
                value={formData.maxConcurrentRequests}
                onChange={handleChange}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="unlimited">Unlimited</option>
              </Select>
              <FormHelperText>Maximum number of concurrent requests your agent can handle</FormHelperText>
            </FormControl>
            
            <Box mt={4}>
              <Button colorScheme="blue" onClick={handleTestConnection}>
                Test Connection
              </Button>
            </Box>
          </>
        ) : (
          // Human user specific fields
          <>
            <FormControl>
              <FormLabel>Workspace Visibility</FormLabel>
              <RadioGroup 
                value={formData.visibility}
                onChange={(value) => handleRadioChange('visibility', value)}
              >
                <Stack direction="column" spacing={3}>
                  <Radio value="private">Private (Only you can access)</Radio>
                  <Radio value="team">Team (You and invited members)</Radio>
                  <Radio value="public">Public (Anyone in your organization)</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
            
            <FormControl>
              <FormLabel>Workspace Template</FormLabel>
              <Select 
                name="template"
                value={formData.template}
                onChange={handleChange}
              >
                <option value="blank">Blank Workspace</option>
                <option value="development">Software Development</option>
                <option value="research">Research Project</option>
                <option value="content">Content Creation</option>
                <option value="data_analysis">Data Analysis</option>
              </Select>
              <FormHelperText>Choose a template to pre-configure your workspace</FormHelperText>
            </FormControl>
            
            <Divider />
            
            <FormControl>
              <FormLabel>Collaboration Settings</FormLabel>
              <HStack>
                <Switch 
                  isChecked={formData.enableCollaboration}
                  onChange={(e) => handleSwitchChange('enableCollaboration', e.target.checked)}
                  colorScheme="blue"
                />
                <Text>Enable real-time collaboration</Text>
              </HStack>
              <FormHelperText>Allow multiple users to work in the workspace simultaneously</FormHelperText>
            </FormControl>
          </>
        )}
      </VStack>
    </Box>
  );
};
