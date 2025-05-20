import React, { useState, useEffect } from 'react';
import { 
  Box, 
  VStack, 
  FormControl, 
  FormLabel, 
  Input, 
  Select, 
  Textarea, 
  Heading, 
  Text,
  FormHelperText,
  FormErrorMessage,
  Divider
} from '@chakra-ui/react';
import { useWizard } from '../WizardProvider.js';

export const UserProfileStep: React.FC = () => {
  const { state, updateSessionData } = useWizard();
  const isAIAgent = state.session?.userType === 'ai_agent';
  
  // Get existing data from session if available
  const existingData = state.session?.data || {};
  
  // Form state
  const [formData, setFormData] = useState({
    name: existingData.name || '',
    email: existingData.email || '',
    role: existingData.role || '',
    organization: existingData.organization || '',
    description: existingData.description || '',
    // AI agent specific fields
    agentType: existingData.agentType || 'general',
    apiVersion: existingData.apiVersion || '1.0',
    maintainer: existingData.maintainer || ''
  });
  
  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Update session data when form changes
  useEffect(() => {
    updateSessionData(formData);
  }, [formData, updateSessionData]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
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
  
  // Validate email format
  const validateEmail = (email: string) => {
    if (!email.trim()) {
      setErrors(prev => ({
        ...prev,
        email: 'Email is required'
      }));
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrors(prev => ({
        ...prev,
        email: 'Please enter a valid email address'
      }));
      return false;
    }
    
    return true;
  };
  
  // Validate form on blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'email') {
      validateEmail(value);
    } else if (name === 'name' || name === 'role' || (isAIAgent && name === 'agentType')) {
      validateField(name, value);
    }
  };

  return (
    <Box>
      <Heading as="h2" size="md" mb={4}>
        {isAIAgent ? 'Agent Profile' : 'Your Profile'}
      </Heading>
      
      <Text mb={6}>
        {isAIAgent 
          ? 'Please provide information about your AI agent to help us integrate it with The New Fuse platform.'
          : 'Please provide some information about yourself to personalize your experience.'}
      </Text>
      
      <VStack spacing={4} align="stretch">
        <FormControl isRequired isInvalid={!!errors.name}>
          <FormLabel>{isAIAgent ? 'Agent Name' : 'Full Name'}</FormLabel>
          <Input 
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={isAIAgent ? 'e.g., Research Assistant Agent' : 'e.g., John Doe'}
          />
          {errors.name && <FormErrorMessage>{errors.name}</FormErrorMessage>}
        </FormControl>
        
        <FormControl isRequired isInvalid={!!errors.email}>
          <FormLabel>{isAIAgent ? 'Contact Email' : 'Email Address'}</FormLabel>
          <Input 
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="e.g., user@example.com"
          />
          {errors.email && <FormErrorMessage>{errors.email}</FormErrorMessage>}
          <FormHelperText>
            {isAIAgent 
              ? 'Email address for the maintainer of this agent'
              : 'We\'ll never share your email with anyone else'}
          </FormHelperText>
        </FormControl>
        
        {isAIAgent ? (
          // AI Agent specific fields
          <>
            <FormControl isRequired isInvalid={!!errors.agentType}>
              <FormLabel>Agent Type</FormLabel>
              <Select 
                name="agentType"
                value={formData.agentType}
                onChange={handleChange}
                onBlur={handleBlur}
              >
                <option value="general">General Purpose</option>
                <option value="research">Research Assistant</option>
                <option value="coding">Code Assistant</option>
                <option value="creative">Creative Assistant</option>
                <option value="data">Data Analysis</option>
                <option value="custom">Custom</option>
              </Select>
              {errors.agentType && <FormErrorMessage>{errors.agentType}</FormErrorMessage>}
            </FormControl>
            
            <FormControl>
              <FormLabel>API Version</FormLabel>
              <Select 
                name="apiVersion"
                value={formData.apiVersion}
                onChange={handleChange}
              >
                <option value="1.0">1.0</option>
                <option value="1.1">1.1</option>
                <option value="2.0">2.0</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel>Maintainer</FormLabel>
              <Input 
                name="maintainer"
                value={formData.maintainer}
                onChange={handleChange}
                placeholder="e.g., OpenAI, Anthropic, or Individual Developer"
              />
            </FormControl>
          </>
        ) : (
          // Human user specific fields
          <>
            <FormControl>
              <FormLabel>Role</FormLabel>
              <Select 
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="">Select your role</option>
                <option value="developer">Developer</option>
                <option value="data_scientist">Data Scientist</option>
                <option value="product_manager">Product Manager</option>
                <option value="designer">Designer</option>
                <option value="researcher">Researcher</option>
                <option value="executive">Executive</option>
                <option value="other">Other</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel>Organization</FormLabel>
              <Input 
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                placeholder="e.g., Acme Inc."
              />
            </FormControl>
          </>
        )}
        
        <Divider my={2} />
        
        <FormControl>
          <FormLabel>{isAIAgent ? 'Agent Description' : 'About You'}</FormLabel>
          <Textarea 
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder={isAIAgent 
              ? 'Briefly describe your agent\'s purpose and capabilities...'
              : 'Tell us a bit about yourself and how you plan to use The New Fuse...'}
            rows={4}
          />
        </FormControl>
      </VStack>
    </Box>
  );
};
