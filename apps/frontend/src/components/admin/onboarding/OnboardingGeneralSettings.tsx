import React, { useState, useEffect } from 'react';
import { OnboardingAdminService } from '../../../services/onboarding-admin.service.js';
import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Switch,
  Button,
  Textarea,
  Select,
  HStack,
  Text,
  Divider,
  Card,
  CardHeader,
  CardBody,
  Heading,
  SimpleGrid,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useColorModeValue,
  useToast,
  Spinner,
  Alert,
  AlertIcon
} from '@chakra-ui/react';

interface OnboardingGeneralSettingsProps {
  onSave: () => void;
  onChange: () => void;
  hasUnsavedChanges: boolean;
}

export const OnboardingGeneralSettings: React.FC<OnboardingGeneralSettingsProps> = ({
  onSave,
  onChange,
  hasUnsavedChanges
}) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    // General settings
    onboardingEnabled: true,
    skipForReturningUsers: true,
    allowSkipping: false,
    requireEmailVerification: true,

    // Appearance
    logoUrl: '/assets/images/logo.png',
    primaryColor: '#3182CE',
    secondaryColor: '#4FD1C5',
    backgroundImage: '',

    // Content
    welcomeTitle: 'Welcome to The New Fuse',
    welcomeMessage: 'The New Fuse is an AI agent coordination platform that enables intelligent interaction between different AI systems.',

    // Behavior
    timeoutMinutes: 30,
    saveProgressAutomatically: true,
    redirectAfterCompletion: '/dashboard',

    // Analytics
    trackOnboardingAnalytics: true,
    collectFeedback: true
  });

  // Fetch general settings from API
  useEffect(() => {
    const fetchGeneralSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await OnboardingAdminService.getGeneralSettings();
        setSettings(data);
      } catch (err) {
        console.error('Error fetching general settings:', err);
        setError('Failed to load general settings. Please try again.');
        // Default settings are already set in the initial state
      } finally {
        setIsLoading(false);
      }
    };

    fetchGeneralSettings();
  }, []);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setSettings(prev => ({ ...prev, [name]: checked }));
    } else {
      setSettings(prev => ({ ...prev, [name]: value }));
    }

    onChange();
  };

  // Handle switch change
  const handleSwitchChange = (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, [name]: e.target.checked }));
    onChange();
  };

  // Handle number input change
  const handleNumberChange = (name: string, value: string) => {
    setSettings(prev => ({ ...prev, [name]: parseInt(value) }));
    onChange();
  };

  // Handle save
  const handleSave = async () => {
    try {
      await OnboardingAdminService.updateGeneralSettings(settings);
      onSave();

      toast({
        title: 'Settings saved',
        description: 'General settings have been saved successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error saving general settings:', err);

      toast({
        title: 'Error saving settings',
        description: 'There was an error saving your settings. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const cardBg = useColorModeValue('white', 'gray.700');

  return (
    <Box>
      {isLoading && (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" mb={4} />
          <Text>Loading general settings...</Text>
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
        <VStack spacing={6} align="stretch">
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {/* General Settings */}
          <Card bg={cardBg}>
            <CardHeader pb={0}>
              <Heading size="md">General Settings</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <FormControl display="flex" alignItems="center">
                  <Switch
                    id="onboarding-enabled"
                    isChecked={settings.onboardingEnabled}
                    onChange={handleSwitchChange('onboardingEnabled')}
                    colorScheme="blue"
                  />
                  <FormLabel htmlFor="onboarding-enabled" mb={0} ml={2}>
                    Enable onboarding for new users
                  </FormLabel>
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <Switch
                    id="skip-returning"
                    isChecked={settings.skipForReturningUsers}
                    onChange={handleSwitchChange('skipForReturningUsers')}
                    colorScheme="blue"
                  />
                  <FormLabel htmlFor="skip-returning" mb={0} ml={2}>
                    Skip onboarding for returning users
                  </FormLabel>
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <Switch
                    id="allow-skipping"
                    isChecked={settings.allowSkipping}
                    onChange={handleSwitchChange('allowSkipping')}
                    colorScheme="blue"
                  />
                  <FormLabel htmlFor="allow-skipping" mb={0} ml={2}>
                    Allow users to skip onboarding
                  </FormLabel>
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <Switch
                    id="require-email"
                    isChecked={settings.requireEmailVerification}
                    onChange={handleSwitchChange('requireEmailVerification')}
                    colorScheme="blue"
                  />
                  <FormLabel htmlFor="require-email" mb={0} ml={2}>
                    Require email verification
                  </FormLabel>
                </FormControl>
              </VStack>
            </CardBody>
          </Card>

          {/* Appearance */}
          <Card bg={cardBg}>
            <CardHeader pb={0}>
              <Heading size="md">Appearance</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>Logo URL</FormLabel>
                  <Input
                    name="logoUrl"
                    value={settings.logoUrl}
                    onChange={handleChange}
                    placeholder="URL to your logo"
                  />
                </FormControl>

                <SimpleGrid columns={2} spacing={4}>
                  <FormControl>
                    <FormLabel>Primary Color</FormLabel>
                    <HStack>
                      <Input
                        name="primaryColor"
                        value={settings.primaryColor}
                        onChange={handleChange}
                        placeholder="#3182CE"
                      />
                      <Box
                        w="36px"
                        h="36px"
                        borderRadius="md"
                        bg={settings.primaryColor}
                        border="1px solid"
                        borderColor="gray.200"
                      />
                    </HStack>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Secondary Color</FormLabel>
                    <HStack>
                      <Input
                        name="secondaryColor"
                        value={settings.secondaryColor}
                        onChange={handleChange}
                        placeholder="#4FD1C5"
                      />
                      <Box
                        w="36px"
                        h="36px"
                        borderRadius="md"
                        bg={settings.secondaryColor}
                        border="1px solid"
                        borderColor="gray.200"
                      />
                    </HStack>
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel>Background Image URL (optional)</FormLabel>
                  <Input
                    name="backgroundImage"
                    value={settings.backgroundImage}
                    onChange={handleChange}
                    placeholder="URL to background image"
                  />
                </FormControl>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Content */}
        <Card bg={cardBg}>
          <CardHeader pb={0}>
            <Heading size="md">Content</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Welcome Title</FormLabel>
                <Input
                  name="welcomeTitle"
                  value={settings.welcomeTitle}
                  onChange={handleChange}
                  placeholder="Welcome to The New Fuse"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Welcome Message</FormLabel>
                <Textarea
                  name="welcomeMessage"
                  value={settings.welcomeMessage}
                  onChange={handleChange}
                  placeholder="Enter welcome message"
                  rows={3}
                />
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {/* Behavior */}
          <Card bg={cardBg}>
            <CardHeader pb={0}>
              <Heading size="md">Behavior</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>Session Timeout (minutes)</FormLabel>
                  <NumberInput
                    min={5}
                    max={120}
                    value={settings.timeoutMinutes}
                    onChange={(value) => handleNumberChange('timeoutMinutes', value)}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <Switch
                    id="save-automatically"
                    isChecked={settings.saveProgressAutomatically}
                    onChange={handleSwitchChange('saveProgressAutomatically')}
                    colorScheme="blue"
                  />
                  <FormLabel htmlFor="save-automatically" mb={0} ml={2}>
                    Save progress automatically
                  </FormLabel>
                </FormControl>

                <FormControl>
                  <FormLabel>Redirect After Completion</FormLabel>
                  <Input
                    name="redirectAfterCompletion"
                    value={settings.redirectAfterCompletion}
                    onChange={handleChange}
                    placeholder="/dashboard"
                  />
                </FormControl>
              </VStack>
            </CardBody>
          </Card>

          {/* Analytics */}
          <Card bg={cardBg}>
            <CardHeader pb={0}>
              <Heading size="md">Analytics</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <FormControl display="flex" alignItems="center">
                  <Switch
                    id="track-analytics"
                    isChecked={settings.trackOnboardingAnalytics}
                    onChange={handleSwitchChange('trackOnboardingAnalytics')}
                    colorScheme="blue"
                  />
                  <FormLabel htmlFor="track-analytics" mb={0} ml={2}>
                    Track onboarding analytics
                  </FormLabel>
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <Switch
                    id="collect-feedback"
                    isChecked={settings.collectFeedback}
                    onChange={handleSwitchChange('collectFeedback')}
                    colorScheme="blue"
                  />
                  <FormLabel htmlFor="collect-feedback" mb={0} ml={2}>
                    Collect user feedback
                  </FormLabel>
                </FormControl>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Divider />

        <HStack justifyContent="flex-end">
          <Button
            colorScheme="blue"
            onClick={handleSave}
            isDisabled={!hasUnsavedChanges}
          >
            Save Changes
          </Button>
        </HStack>
      </VStack>
      )}
    </Box>
  );
};
