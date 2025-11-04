#!/usr/bin/env node

/**
 * Targeted cleanup for remaining UI library imports
 */

const fs = require('fs');
const path = require('path');

// Files that need manual fixes
const filesToFix = [
  'src/components/demo/ChromeExtensionDemo.tsx',
  'src/components/demo/EnhancedChromeExtensionDemo.tsx',
  'src/components/ui/popup/PopupContainer.tsx'
];

// Complete rewrite for ChromeExtensionDemo
const chromeDemoContent = `import React, { useState } from "react";
import { Card, CardBody, Box, Text, Button, Fade } from '@chakra-ui/react';
import { Extension, Close } from 'lucide-react';

import { PopupContainer } from "../ui/popup";

export interface ChromeExtensionDemoProps {
  /** Whether to show the demo by default */
  defaultOpen?: boolean;
}

const ChromeExtensionDemo: React.FC<ChromeExtensionDemoProps> = ({
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleThemeChange = (darkMode: boolean) => {
    setIsDarkMode(darkMode);
  };

  if (!isOpen) {
    return (
      <Card m={2} maxW="400px">
        <CardBody>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Extension color="blue.500" />
            <Text fontSize="xl" fontWeight="bold">Chrome Extension UI Demo</Text>
          </Box>
          <Text color="gray.600" mb={4}>
            Experience the recovered Chrome extension interface integrated into
            the main application.
          </Text>
          <Button
            colorScheme="blue"
            onClick={() => setIsOpen(true)}
            leftIcon={<Extension />}
          >
            Open Extension Interface
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <Fade in={isOpen}>
      <Box
        position="fixed"
        top="20px"
        right="20px"
        zIndex="9999"
        boxShadow="2xl"
        borderRadius="lg"
        overflow="hidden"
        bg="white"
      >
        {/* Close Button */}
        <Box
          position="absolute"
          top="8px"
          right="8px"
          zIndex="10000"
        >
          <Button
            size="sm"
            onClick={() => setIsOpen(false)}
            minW="auto"
            p="2px"
            bg="rgba(0,0,0,0.1)"
            _hover={{ bg: "rgba(0,0,0,0.2)" }}
          >
            <Close size="16px" />
          </Button>
        </Box>

        {/* Popup Container */}
        <PopupContainer
          isMainApp={true}
          initialDarkMode={isDarkMode}
          onThemeChange={handleThemeChange}
          containerStyle={{
            width: "420px",
            height: "620px",
            maxHeight: "90vh",
          }}
        />
      </Box>
    </Fade>
  );
};

export default ChromeExtensionDemo;
`;

// Enhanced Chrome Demo with simplified content
const enhancedDemoContent = `import React, { useState } from "react";
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
`;

// Simple popup container fix
const popupContainerContent = `import React from 'react';
import { Box, Button, Text } from '@chakra-ui/react';
import { RefreshCw, Settings, Moon, Sun, Bug, Keyboard, HelpCircle, LayoutDashboard, Globe, Sparkles, Wrench, Monitor, Clock, Code, HardDrive, Shield, Zap } from 'lucide-react';

interface PopupContainerProps {
  isMainApp?: boolean;
  initialDarkMode?: boolean;
  onThemeChange?: (dark: boolean) => void;
  containerStyle?: React.CSSProperties;
}

export const PopupContainer: React.FC<PopupContainerProps> = ({
  isMainApp = false,
  initialDarkMode = false,
  onThemeChange,
  containerStyle = {},
}) => {
  const [darkMode, setDarkMode] = React.useState(initialDarkMode);

  const handleThemeChange = (newDarkMode: boolean) => {
    setDarkMode(newDarkMode);
    onThemeChange?.(newDarkMode);
  };

  return (
    <Box
      width="100%"
      height="100%"
      bg={darkMode ? 'gray.800' : 'white'}
      color={darkMode ? 'white' : 'gray.800'}
      p={4}
      {...containerStyle}
    >
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
        <Text fontSize="lg" fontWeight="bold">
          {isMainApp ? 'Main App Integration' : 'Chrome Extension'}
        </Text>
        <Button
          size="sm"
          onClick={() => handleThemeChange(!darkMode)}
          leftIcon={darkMode ? <Sun size={16} /> : <Moon size={16} />}
        >
          {darkMode ? 'Light' : 'Dark'}
        </Button>
      </Box>

      {/* Quick Actions */}
      <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2} mb={4}>
        <Button size="sm" leftIcon={<LayoutDashboard size={16} />}>
          Dashboard
        </Button>
        <Button size="sm" leftIcon={<Code size={16} />}>
          Code
        </Button>
        <Button size="sm" leftIcon={<Monitor size={16} />}>
          Debug
        </Button>
        <Button size="sm" leftIcon={<Settings size={16} />}>
          Settings
        </Button>
      </Box>

      {/* Status */}
      <Box p={3} bg={darkMode ? 'gray.700' : 'gray.100'} borderRadius="md">
        <Text fontSize="sm" fontWeight="medium" mb={2}>System Status</Text>
        <Box display="flex" alignItems="center" gap={2}>
          <Box w={2} h={2} bg="green.500" borderRadius="full" />
          <Text fontSize="xs">Extension active</Text>
        </Box>
      </Box>
    </Box>
  );
};
`;

function fixFiles() {
  console.log('🔧 Fixing remaining UI library files...');
  
  // Fix ChromeExtensionDemo
  const chromeDemoPath = path.join(__dirname, 'apps', 'frontend', 'src/components/demo/ChromeExtensionDemo.tsx');
  fs.writeFileSync(chromeDemoPath, chromeDemoContent);
  console.log('  ✅ Fixed: ChromeExtensionDemo.tsx');
  
  // Fix EnhancedChromeExtensionDemo
  const enhancedDemoPath = path.join(__dirname, 'apps', 'frontend', 'src/components/demo/EnhancedChromeExtensionDemo.tsx');
  fs.writeFileSync(enhancedDemoPath, enhancedDemoContent);
  console.log('  ✅ Fixed: EnhancedChromeExtensionDemo.tsx');
  
  // Fix PopupContainer
  const popupPath = path.join(__dirname, 'apps', 'frontend', 'src/components/ui/popup/PopupContainer.tsx');
  fs.writeFileSync(popupPath, popupContainerContent);
  console.log('  ✅ Fixed: PopupContainer.tsx');
  
  console.log('\n🎉 All UI library files fixed!');
}

if (require.main === module) {
  try {
    fixFiles();
    process.exit(0);
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

module.exports = { fixFiles };