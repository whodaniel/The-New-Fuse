import React, { useState, useCallback } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Heading,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Divider,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton
} from '@chakra-ui/react';
import { WorkflowCanvas } from '../components/WorkflowBuilder/WorkflowCanvas.js';
import { ModularPromptTemplatingSystem, PromptTemplateServiceImpl, PromptTemplate } from '@the-new-fuse/prompt-templating';

export const WorkflowsPage: React.FC = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeTab, setActiveTab] = useState(0);
  const [promptTemplateService] = useState(() => new PromptTemplateServiceImpl());
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);

  // Handle exporting template to workflow
  const handleExportToWorkflow = useCallback((template: PromptTemplate) => {
    setSelectedTemplate(template);
    setActiveTab(0); // Switch to workflow tab
    onClose();
    
    toast({
      title: 'Template ready for workflow',
      description: `"${template.name}" is ready to be added to your workflow`,
      status: 'success',
      duration: 3000
    });
  }, [toast, onClose]);

  // Handle opening prompt template editor
  const handleOpenTemplateEditor = useCallback(() => {
    onOpen();
  }, [onOpen]);

  return (
    <Box p={6} height="100vh">
      <Flex direction="column" height="100%">
        {/* Header */}
        <Box mb={6}>
          <Heading size="lg" mb={2}>Workflow Builder</Heading>
          <p className="text-gray-600">
            Design and execute multi-step AI workflows with drag-and-drop components
          </p>
        </Box>

        {/* Main Content */}
        <Flex flex={1} overflow="hidden">
          <Tabs 
            index={activeTab} 
            onChange={setActiveTab} 
            orientation="vertical" 
            variant="line"
            width="100%"
            height="100%"
          >
            <TabList width="200px" borderRightWidth="1px" borderColor="gray.200">
              <Tab justifyContent="flex-start" py={4}>
                Workflow Canvas
              </Tab>
              <Tab justifyContent="flex-start" py={4}>
                Prompt Templates
              </Tab>
              <Tab justifyContent="flex-start" py={4}>
                Analytics
              </Tab>
              <Tab justifyContent="flex-start" py={4}>
                Settings
              </Tab>
            </TabList>

            <TabPanels flex={1} height="100%">
              {/* Workflow Canvas Tab */}
              <TabPanel p={0} height="100%">
                <Flex direction="column" height="100%">
                  {/* Canvas Toolbar */}
                  <Box p={4} borderBottomWidth="1px" borderColor="gray.200">
                    <HStack spacing={4}>
                      <Button
                        onClick={handleOpenTemplateEditor}
                        colorScheme="purple"
                        size="sm"
                      >
                        Create Prompt Template
                      </Button>
                      {selectedTemplate && (
                        <Box>
                          <span className="text-sm text-gray-600">
                            Selected template: <strong>{selectedTemplate.name}</strong>
                          </span>
                        </Box>
                      )}
                    </HStack>
                  </Box>

                  {/* Workflow Canvas */}
                  <Box flex={1}>
                    <WorkflowCanvas 
                      selectedTemplate={selectedTemplate}
                      promptTemplateService={promptTemplateService}
                    />
                  </Box>
                </Flex>
              </TabPanel>

              {/* Prompt Templates Tab */}
              <TabPanel p={0} height="100%">
                <ModularPromptTemplatingSystem
                  templateService={promptTemplateService}
                  onExportToWorkflow={handleExportToWorkflow}
                />
              </TabPanel>

              {/* Analytics Tab */}
              <TabPanel p={6}>
                <VStack spacing={6} align="stretch">
                  <Heading size="md">Workflow Analytics</Heading>
                  
                  <Box p={6} borderWidth="1px" borderRadius="lg">
                    <Heading size="sm" mb={4}>Execution Statistics</Heading>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">127</div>
                        <div className="text-sm text-blue-600">Total Executions</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">94.2%</div>
                        <div className="text-sm text-green-600">Success Rate</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">1,250ms</div>
                        <div className="text-sm text-purple-600">Avg Response Time</div>
                      </div>
                    </div>
                  </Box>

                  <Box p={6} borderWidth="1px" borderRadius="lg">
                    <Heading size="sm" mb={4}>Popular Node Types</Heading>
                    <VStack spacing={2} align="stretch">
                      <div className="flex justify-between items-center">
                        <span>Prompt Template</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div className="bg-purple-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                          </div>
                          <span className="text-sm text-gray-500">85%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>LLM Completion</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '72%' }}></div>
                          </div>
                          <span className="text-sm text-gray-500">72%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Data Transform</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '58%' }}></div>
                          </div>
                          <span className="text-sm text-gray-500">58%</span>
                        </div>
                      </div>
                    </VStack>
                  </Box>
                </VStack>
              </TabPanel>

              {/* Settings Tab */}
              <TabPanel p={6}>
                <VStack spacing={6} align="stretch">
                  <Heading size="md">Workflow Settings</Heading>
                  
                  <Box p={6} borderWidth="1px" borderRadius="lg">
                    <Heading size="sm" mb={4}>Default Configuration</Heading>
                    <VStack spacing={4} align="stretch">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Default LLM Model
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                          <option>GPT-4</option>
                          <option>GPT-3.5 Turbo</option>
                          <option>Claude-3 Sonnet</option>
                          <option>Claude-3 Haiku</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Execution Timeout (seconds)
                        </label>
                        <input 
                          type="number" 
                          defaultValue={300}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Concurrent Executions
                        </label>
                        <input 
                          type="number" 
                          defaultValue={5}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </VStack>
                  </Box>

                  <Box p={6} borderWidth="1px" borderRadius="lg">
                    <Heading size="sm" mb={4}>Prompt Template Settings</Heading>
                    <VStack spacing={4} align="stretch">
                      <div className="flex items-center justify-between">
                        <span>Enable version tracking</span>
                        <input type="checkbox" defaultChecked className="form-checkbox" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Auto-save templates</span>
                        <input type="checkbox" defaultChecked className="form-checkbox" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Show usage analytics</span>
                        <input type="checkbox" defaultChecked className="form-checkbox" />
                      </div>
                    </VStack>
                  </Box>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Flex>
      </Flex>

      {/* Prompt Template Editor Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent maxW="90vw" maxH="90vh">
          <ModalHeader>Prompt Template Editor</ModalHeader>
          <ModalCloseButton />
          <ModalBody p={0} overflow="hidden">
            <Box height="70vh">
              <ModularPromptTemplatingSystem
                templateService={promptTemplateService}
                onExportToWorkflow={handleExportToWorkflow}
              />
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default WorkflowsPage;
