import React, { useState, useEffect } from 'react';
import { 
  Box, 
  VStack, 
  Heading, 
  Text, 
  SimpleGrid, 
  Checkbox, 
  CheckboxGroup,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Divider,
  Button,
  HStack,
  Icon,
  useColorModeValue
} from '@chakra-ui/react';
import { 
  FiFile, 
  FiGlobe, 
  FiTerminal, 
  FiCode, 
  FiLink, 
  FiBrain,
  FiGithub,
  FiDatabase,
  FiClipboard,
  FiCloud
} from 'react-icons/fi';
import { useWizard } from '../WizardProvider.js';

export const ToolsSelectionStep: React.FC = () => {
  const { state, updateSessionData } = useWizard();
  
  // Get existing data from session if available
  const existingData = state.session?.data || {};
  
  // Form state
  const [selectedTools, setSelectedTools] = useState<string[]>(
    existingData.selectedTools || []
  );
  
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>(
    existingData.selectedIntegrations || []
  );
  
  // Update session data when selections change
  useEffect(() => {
    updateSessionData({
      selectedTools,
      selectedIntegrations
    });
  }, [selectedTools, selectedIntegrations, updateSessionData]);
  
  const handleToolsChange = (values: string[]) => {
    setSelectedTools(values);
  };
  
  const handleIntegrationsChange = (values: string[]) => {
    setSelectedIntegrations(values);
  };
  
  const handleSelectAll = (category: 'tools' | 'integrations') => {
    if (category === 'tools') {
      setSelectedTools([
        'save-file', 'edit-file', 'remove-files',
        'open-browser', 'web-search', 'web-fetch',
        'launch-process', 'kill-process', 'read-process', 'write-process', 'list-processes',
        'diagnostics', 'codebase-retrieval',
        'remember'
      ]);
    } else {
      setSelectedIntegrations([
        'github-api', 'linear', 'jira', 'confluence', 'notion', 'supabase'
      ]);
    }
  };
  
  const handleClearAll = (category: 'tools' | 'integrations') => {
    if (category === 'tools') {
      setSelectedTools([]);
    } else {
      setSelectedIntegrations([]);
    }
  };
  
  const bgColor = useColorModeValue('gray.50', 'gray.700');

  const toolCategories = [
    {
      name: 'File Management',
      icon: FiFile,
      tools: [
        { id: 'save-file', label: 'Save File', description: 'Create new files with content' },
        { id: 'edit-file', label: 'Edit File', description: 'View, create, and edit files' },
        { id: 'remove-files', label: 'Remove Files', description: 'Safely delete files' },
      ]
    },
    {
      name: 'Web Interaction',
      icon: FiGlobe,
      tools: [
        { id: 'open-browser', label: 'Open Browser', description: 'Open URLs in the default browser' },
        { id: 'web-search', label: 'Web Search', description: 'Search the web for information' },
        { id: 'web-fetch', label: 'Web Fetch', description: 'Fetch and convert webpage content to Markdown' },
      ]
    },
    {
      name: 'Process Management',
      icon: FiTerminal,
      tools: [
        { id: 'launch-process', label: 'Launch Process', description: 'Run shell commands' },
        { id: 'kill-process', label: 'Kill Process', description: 'Terminate processes' },
        { id: 'read-process', label: 'Read Process', description: 'Read output from a terminal' },
        { id: 'write-process', label: 'Write Process', description: 'Write input to a terminal' },
        { id: 'list-processes', label: 'List Processes', description: 'List all known terminals and their states' },
      ]
    },
    {
      name: 'Code Analysis',
      icon: FiCode,
      tools: [
        { id: 'diagnostics', label: 'Diagnostics', description: 'Get issues from the IDE' },
        { id: 'codebase-retrieval', label: 'Codebase Retrieval', description: 'Search the codebase for information' },
      ]
    },
    {
      name: 'Memory Tools',
      icon: FiBrain,
      tools: [
        { id: 'remember', label: 'Remember', description: 'Create long-term memories' },
      ]
    },
  ];
  
  const integrationCategories = [
    {
      name: 'Development Tools',
      icon: FiGithub,
      integrations: [
        { id: 'github-api', label: 'GitHub API', description: 'Interact with GitHub repositories, issues, and PRs' },
        { id: 'linear', label: 'Linear', description: 'Manage tasks and issues in Linear' },
      ]
    },
    {
      name: 'Project Management',
      icon: FiClipboard,
      integrations: [
        { id: 'jira', label: 'Jira', description: 'Work with Jira issues and projects' },
        { id: 'confluence', label: 'Confluence', description: 'Access and update Confluence pages' },
      ]
    },
    {
      name: 'Knowledge Management',
      icon: FiDatabase,
      integrations: [
        { id: 'notion', label: 'Notion', description: 'Interact with Notion databases and pages' },
      ]
    },
    {
      name: 'Cloud Services',
      icon: FiCloud,
      integrations: [
        { id: 'supabase', label: 'Supabase', description: 'Interact with Supabase databases and services' },
      ]
    },
  ];

  return (
    <Box>
      <Heading as="h2" size="md" mb={4}>
        Tools & Integrations
      </Heading>
      
      <Text mb={6}>
        Select the tools and integrations you want to enable for your AI assistants.
      </Text>
      
      <VStack spacing={6} align="stretch">
        <Box>
          <HStack justify="space-between" mb={3}>
            <Heading as="h3" size="sm">
              Tools
            </Heading>
            <HStack spacing={2}>
              <Button size="xs" onClick={() => handleSelectAll('tools')}>
                Select All
              </Button>
              <Button size="xs" variant="outline" onClick={() => handleClearAll('tools')}>
                Clear All
              </Button>
            </HStack>
          </HStack>
          
          <CheckboxGroup 
            colorScheme="blue" 
            value={selectedTools}
            onChange={handleToolsChange}
          >
            <Accordion allowMultiple defaultIndex={[0]}>
              {toolCategories.map((category, idx) => (
                <AccordionItem key={idx} bg={bgColor} mb={2} borderRadius="md">
                  <h2>
                    <AccordionButton py={3}>
                      <HStack flex="1" textAlign="left">
                        <Icon as={category.icon} />
                        <Text fontWeight="medium">{category.name}</Text>
                      </HStack>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <SimpleGrid columns={1} spacing={3}>
                      {category.tools.map((tool) => (
                        <Checkbox key={tool.id} value={tool.id}>
                          <Box>
                            <Text fontWeight="medium">{tool.label}</Text>
                            <Text fontSize="sm" color="gray.600">{tool.description}</Text>
                          </Box>
                        </Checkbox>
                      ))}
                    </SimpleGrid>
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
          </CheckboxGroup>
        </Box>
        
        <Divider />
        
        <Box>
          <HStack justify="space-between" mb={3}>
            <Heading as="h3" size="sm">
              Integrations
            </Heading>
            <HStack spacing={2}>
              <Button size="xs" onClick={() => handleSelectAll('integrations')}>
                Select All
              </Button>
              <Button size="xs" variant="outline" onClick={() => handleClearAll('integrations')}>
                Clear All
              </Button>
            </HStack>
          </HStack>
          
          <CheckboxGroup 
            colorScheme="blue" 
            value={selectedIntegrations}
            onChange={handleIntegrationsChange}
          >
            <Accordion allowMultiple defaultIndex={[0]}>
              {integrationCategories.map((category, idx) => (
                <AccordionItem key={idx} bg={bgColor} mb={2} borderRadius="md">
                  <h2>
                    <AccordionButton py={3}>
                      <HStack flex="1" textAlign="left">
                        <Icon as={category.icon} />
                        <Text fontWeight="medium">{category.name}</Text>
                      </HStack>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <SimpleGrid columns={1} spacing={3}>
                      {category.integrations.map((integration) => (
                        <Checkbox key={integration.id} value={integration.id}>
                          <Box>
                            <Text fontWeight="medium">{integration.label}</Text>
                            <Text fontSize="sm" color="gray.600">{integration.description}</Text>
                          </Box>
                        </Checkbox>
                      ))}
                    </SimpleGrid>
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
          </CheckboxGroup>
        </Box>
        
        <Box bg="blue.50" p={4} borderRadius="md">
          <Text fontSize="sm" color="blue.800">
            <strong>Note:</strong> You can always change these settings later in your workspace settings.
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};
