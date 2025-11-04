import React, { useState } from "react";
import { Container, Card, CardBody, Box, Text, Button, Tabs, TabList, Tab, TabPanels, TabPanel, Input, Textarea } from '@chakra-ui/react';
import { Extension, Close, ExternalLink, Code, ArrowRightLeft } from 'lucide-react';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box p={4}>{children}</Box>}
    </div>
  );
}

const EnhancedChromeExtensionDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleThemeChange = (darkMode: boolean) => {
    setIsDarkMode(darkMode);
  };

  return (
    <Container maxW="1200px" mx="auto" p={4}>
      {/* Header */}
      <Card mb={4} bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" color="white">
        <CardBody>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={3}>
              <Extension size={32} />
              <Box>
                <Text fontSize="2xl" fontWeight="bold">Enhanced Chrome Extension</Text>
                <Text opacity={0.9}>Advanced UI Components & Features</Text>
              </Box>
            </Box>
            <Button
              size="sm"
              colorScheme="whiteAlpha"
              variant="outline"
              onClick={() => setShowPopup(!showPopup)}
              leftIcon={<ExternalLink />}
            >
              Launch Extension
            </Button>
          </Box>
        </CardBody>
      </Card>

      {/* Feature Tabs */}
      <Card>
        <CardBody>
          <Tabs index={activeTab} onChange={setActiveTab}>
            <TabList>
              <Tab>Interface</Tab>
              <Tab>Code Integration</Tab>
              <Tab>Data Flow</Tab>
              <Tab>Settings</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" mb={3}>Extension Interface</Text>
                  <Text color="gray.600" mb={4}>
                    The extension provides a streamlined interface for Chrome browser integration
                    with real-time communication and feature management.
                  </Text>
                  <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={4}>
                    <Card>
                      <CardBody>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                          <Extension size={20} />
                          <Text fontWeight="medium">Core Features</Text>
                        </Box>
                        <Text fontSize="sm" color="gray.600">
                          Element selection, DOM manipulation, and browser state management.
                        </Text>
                      </CardBody>
                    </Card>
                    <Card>
                      <CardBody>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                          <Code size={20} />
                          <Text fontWeight="medium">Developer Tools</Text>
                        </Box>
                        <Text fontSize="sm" color="gray.600">
                          Advanced debugging and development features for power users.
                        </Text>
                      </CardBody>
                    </Card>
                  </Box>
                </Box>
              </TabPanel>

              <TabPanel>
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" mb={3}>Code Integration</Text>
                  <Text color="gray.600" mb={4}>
                    Seamless integration with your development workflow and codebase.
                  </Text>
                  <Box mb={4}>
                    <Text fontSize="sm" fontWeight="medium" mb={2}>API Endpoint Configuration</Text>
                    <Input placeholder="https://api.example.com/endpoint" size="sm" />
                  </Box>
                  <Box mb={4}>
                    <Text fontSize="sm" fontWeight="medium" mb={2}>Custom Scripts</Text>
                    <Textarea 
                      placeholder="Enter custom JavaScript or configuration..." 
                      size="sm" 
                      rows={4}
                    />
                  </Box>
                </Box>
              </TabPanel>

              <TabPanel>
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" mb={3}>Data Flow Management</Text>
                  <Text color="gray.600" mb={4}>
                    Real-time data synchronization and state management across components.
                  </Text>
                  <Box display="flex" alignItems="center" gap={4} p={4} bg="gray.50" borderRadius="md">
                    <ArrowRightLeft size={24} color="blue.500" />
                    <Box>
                      <Text fontWeight="medium">Connected Services</Text>
                      <Text fontSize="sm" color="gray.600">4 active integrations</Text>
                    </Box>
                  </Box>
                </Box>
              </TabPanel>

              <TabPanel>
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" mb={3}>Settings & Configuration</Text>
                  <Text color="gray.600" mb={4}>
                    Customize extension behavior and preferences.
                  </Text>
                  <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={2}>Theme</Text>
                      <Button size="sm" variant="outline">
                        {isDarkMode ? 'Dark' : 'Light'} Mode
                      </Button>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={2}>Notifications</Text>
                      <Button size="sm" colorScheme="blue">Enable</Button>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={2}>Auto-update</Text>
                      <Button size="sm" colorScheme="green">Active</Button>
                    </Box>
                  </Box>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>
    </Container>
  );
};

export default EnhancedChromeExtensionDemo;
