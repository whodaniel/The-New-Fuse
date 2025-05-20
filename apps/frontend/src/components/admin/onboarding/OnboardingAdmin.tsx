import React, { useState, useEffect } from 'react';
import { OnboardingAdminService } from '../../../services/onboarding-admin.service.js';
import {
  Box,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Text,
  Alert,
  AlertIcon,
  useToast
} from '@chakra-ui/react';
import { OnboardingGeneralSettings } from './OnboardingGeneralSettings.js';
import { OnboardingStepsConfig } from './OnboardingStepsConfig.js';
import { OnboardingWizardPreview } from './OnboardingWizardPreview.js';
import { OnboardingAISettings } from './OnboardingAISettings.js';
import { OnboardingUserTypes } from './OnboardingUserTypes.js';

export const OnboardingAdmin: React.FC = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Handle tab change
  const handleTabChange = (index: number) => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave this tab?');
      if (!confirmed) {
        return;
      }
    }

    setActiveTab(index);
    setHasUnsavedChanges(false);
  };

  // Handle save
  const handleSave = () => {
    // The actual save operation is handled by the individual components
    // This is just to update the parent component state
    toast({
      title: 'Settings saved',
      description: 'Your onboarding settings have been saved successfully.',
      status: 'success',
      duration: 5000,
      isClosable: true,
    });

    setHasUnsavedChanges(false);
  };

  // Handle changes
  const handleChange = () => {
    setHasUnsavedChanges(true);
  };

  return (
    <Box>
      <Heading mb={6}>Onboarding Settings</Heading>

      <Text mb={4}>
        Configure the onboarding experience for users and AI agents. These settings control how users and agents are onboarded to The New Fuse platform.
      </Text>

      {hasUnsavedChanges && (
        <Alert status="warning" mb={4}>
          <AlertIcon />
          You have unsaved changes. Make sure to save your changes before leaving this page.
        </Alert>
      )}

      <Tabs
        isLazy
        colorScheme="blue"
        index={activeTab}
        onChange={handleTabChange}
        variant="enclosed"
      >
        <TabList>
          <Tab>General</Tab>
          <Tab>User Types</Tab>
          <Tab>Wizard Steps</Tab>
          <Tab>AI Settings</Tab>
          <Tab>Preview</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <OnboardingGeneralSettings
              onSave={handleSave}
              onChange={handleChange}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          </TabPanel>

          <TabPanel>
            <OnboardingUserTypes
              onSave={handleSave}
              onChange={handleChange}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          </TabPanel>

          <TabPanel>
            <OnboardingStepsConfig
              onSave={handleSave}
              onChange={handleChange}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          </TabPanel>

          <TabPanel>
            <OnboardingAISettings
              onSave={handleSave}
              onChange={handleChange}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          </TabPanel>

          <TabPanel>
            <OnboardingWizardPreview />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};
