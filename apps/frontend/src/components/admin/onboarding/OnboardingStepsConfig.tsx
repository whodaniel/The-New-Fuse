import React, { useState, useEffect, useCallback } from 'react';
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
  IconButton,
  Divider,
  useColorModeValue,
  useToast,
  Flex,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormHelperText,
  Switch,
  Spinner,
  FormErrorMessage
} from '@chakra-ui/react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiArrowUp,
  FiArrowDown,
  FiEye,
  FiSettings,
  FiInfo
} from 'react-icons/fi';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { OnboardingAdminService } from '../../../services/onboarding-admin.service.js';

interface OnboardingStepsConfigProps {
  onSave: () => void;
  onChange: () => void;
  hasUnsavedChanges: boolean;
}

interface StepConfig {
  id: string;
  type: 'welcome' | 'profile' | 'ai_preferences' | 'workspace' | 'tools' | 'greeter' | 'completion' | 'custom';
  title: string;
  description: string;
  enabled: boolean;
  required: boolean;
  userTypes: string[];
  content?: {
    heading?: string;
    subheading?: string;
    imageUrl?: string;
    buttonText?: string;
  };
  customFields?: {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio';
    options?: { label: string; value: string }[];
    required: boolean;
  }[];
}

export const OnboardingStepsConfig: React.FC<OnboardingStepsConfigProps> = ({
  onSave,
  onChange,
  hasUnsavedChanges
}) => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [steps, setSteps] = useState<StepConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch steps from API
  useEffect(() => {
    const fetchSteps = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await OnboardingAdminService.getSteps();
        setSteps(data);
      } catch (err) {
        console.error('Error fetching onboarding steps:', err);
        setError('Failed to load onboarding steps. Please try again.');
        // Set default steps if API fails
        setSteps([
          {
            id: '1',
            type: 'welcome',
            title: 'Welcome',
            description: 'Introduction to The New Fuse platform',
            enabled: true,
            required: true,
            userTypes: ['human', 'ai_agent'],
            content: {
              heading: 'Welcome to The New Fuse',
              subheading: 'The AI agent coordination platform that enables intelligent interaction between different AI systems.',
              imageUrl: '/assets/images/welcome.png',
              buttonText: 'Get Started'
            }
          },
          {
            id: '2',
            type: 'profile',
            title: 'User Profile',
            description: 'Collect user information',
            enabled: true,
            required: true,
            userTypes: ['human'],
            content: {
              heading: 'Tell us about yourself',
              subheading: 'This information helps us personalize your experience.'
            }
          },
          {
            id: '3',
            type: 'completion',
            title: 'Complete',
            description: 'Onboarding completion',
            enabled: true,
            required: true,
            userTypes: ['human', 'ai_agent'],
            content: {
              heading: 'All Set!',
              subheading: 'You\'re ready to start using The New Fuse.',
              buttonText: 'Get Started'
            }
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSteps();
  }, []);

  const [currentStep, setCurrentStep] = useState<StepConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleAddStep = () => {
    const newStep: StepConfig = {
      id: `step-${Date.now()}`,
      type: 'custom',
      title: 'New Step',
      description: 'Description of the new step',
      enabled: true,
      required: false,
      userTypes: ['human'],
      content: {
        heading: 'New Step',
        subheading: 'Description of the new step'
      },
      customFields: []
    };

    setCurrentStep(newStep);
    setIsEditing(false);
    onOpen();
  };

  const handleEditStep = (step: StepConfig) => {
    setCurrentStep({...step});
    setIsEditing(true);
    onOpen();
  };

  const handleDeleteStep = (id: string) => {
    setSteps(steps.filter(step => step.id !== id));
    onChange();

    toast({
      title: 'Step deleted',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleSaveStep = () => {
    if (!currentStep) return;

    if (isEditing) {
      setSteps(steps.map(step => step.id === currentStep.id ? currentStep : step));
    } else {
      setSteps([...steps, currentStep]);
    }

    onChange();
    onClose();

    toast({
      title: isEditing ? 'Step updated' : 'Step added',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleMoveStep = (id: string, direction: 'up' | 'down') => {
    const index = steps.findIndex(step => step.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === steps.length - 1)
    ) {
      return;
    }

    const newSteps = [...steps];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];

    setSteps(newSteps);
    onChange();
  };

  const handleToggleStep = (id: string) => {
    setSteps(steps.map(step =>
      step.id === id ? {...step, enabled: !step.enabled} : step
    ));
    onChange();
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(steps);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSteps(items);
    onChange();
  };

  const handleSaveChanges = async () => {
    try {
      await OnboardingAdminService.updateSteps(steps);
      onSave();

      toast({
        title: 'Changes saved',
        description: 'Onboarding steps configuration has been saved.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error saving onboarding steps:', err);

      toast({
        title: 'Error saving changes',
        description: 'There was an error saving your changes. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!currentStep) return;

    const { name, value } = e.target;

    if (name.startsWith('content.')) {
      const contentField = name.split('.')[1];
      setCurrentStep({
        ...currentStep,
        content: {
          ...currentStep.content,
          [contentField]: value
        }
      });
    } else {
      setCurrentStep({
        ...currentStep,
        [name]: value
      });
    }
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    if (!currentStep) return;

    setCurrentStep({
      ...currentStep,
      [name]: checked
    });
  };

  const handleUserTypeToggle = (userType: string) => {
    if (!currentStep) return;

    const userTypes = currentStep.userTypes.includes(userType)
      ? currentStep.userTypes.filter(type => type !== userType)
      : [...currentStep.userTypes, userType];

    setCurrentStep({
      ...currentStep,
      userTypes
    });
  };

  return (
    <Box>
      <HStack justifyContent="space-between" mb={6}>
        <Heading size="md">Onboarding Wizard Steps</Heading>
        <Button
          colorScheme="blue"
          leftIcon={<FiPlus />}
          onClick={handleAddStep}
          isDisabled={isLoading}
        >
          Add Step
        </Button>
      </HStack>

      <HStack mb={4}>
        <Text>
          Configure the steps in your onboarding wizard. Drag and drop to reorder steps.
        </Text>
        <Tooltip
          label="Each step represents a screen in the onboarding wizard. Steps can be customized for different user types."
          placement="top"
          hasArrow
        >
          <Box as="span">
            <FiInfo />
          </Box>
        </Tooltip>
      </HStack>

      {isLoading && (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" mb={4} />
          <Text>Loading onboarding steps...</Text>
        </Box>
      )}

      {error && !isLoading && (
        <Box
          p={4}
          mb={4}
          bg="red.50"
          color="red.500"
          borderRadius="md"
          borderWidth="1px"
          borderColor="red.200"
        >
          <Heading size="sm" mb={2}>Error Loading Steps</Heading>
          <Text>{error}</Text>
          <Button
            mt={2}
            size="sm"
            colorScheme="red"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Box>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="steps">
          {(provided) => (
            <VStack
              spacing={4}
              align="stretch"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {steps.map((step, index) => (
                <Draggable key={step.id} draggableId={step.id} index={index}>
                  {(provided) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      borderWidth="1px"
                      borderColor={borderColor}
                      bg={bgColor}
                      boxShadow="sm"
                      borderRadius="md"
                      opacity={step.enabled ? 1 : 0.6}
                    >
                      <CardHeader pb={2}>
                        <Flex justify="space-between" align="center">
                          <HStack>
                            <Heading size="sm">{step.title}</Heading>
                            <Badge colorScheme={step.required ? 'red' : 'green'}>
                              {step.required ? 'Required' : 'Optional'}
                            </Badge>
                            {!step.enabled && (
                              <Badge colorScheme="gray">Disabled</Badge>
                            )}
                          </HStack>
                          <HStack>
                            <IconButton
                              aria-label="Move step up"
                              icon={<FiArrowUp />}
                              size="sm"
                              variant="ghost"
                              isDisabled={index === 0}
                              onClick={() => handleMoveStep(step.id, 'up')}
                            />
                            <IconButton
                              aria-label="Move step down"
                              icon={<FiArrowDown />}
                              size="sm"
                              variant="ghost"
                              isDisabled={index === steps.length - 1}
                              onClick={() => handleMoveStep(step.id, 'down')}
                            />
                            <IconButton
                              aria-label="Toggle step"
                              icon={<FiEye />}
                              size="sm"
                              variant="ghost"
                              colorScheme={step.enabled ? 'blue' : 'gray'}
                              onClick={() => handleToggleStep(step.id)}
                            />
                            <IconButton
                              aria-label="Edit step"
                              icon={<FiEdit2 />}
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditStep(step)}
                            />
                            <IconButton
                              aria-label="Delete step"
                              icon={<FiTrash2 />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              isDisabled={step.required && step.type !== 'custom'}
                              onClick={() => handleDeleteStep(step.id)}
                            />
                          </HStack>
                        </Flex>
                      </CardHeader>
                      <CardBody pt={0}>
                        <Text fontSize="sm" color="gray.500">
                          {step.description}
                        </Text>
                        <HStack mt={2} spacing={2}>
                          <Badge colorScheme="purple">{step.type}</Badge>
                          {step.userTypes.map(type => (
                            <Badge key={type} colorScheme="blue">
                              {type === 'human' ? 'Human Users' : 'AI Agents'}
                            </Badge>
                          ))}
                        </HStack>
                      </CardBody>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </VStack>
          )}
        </Droppable>
      </DragDropContext>

      <Button
        mt={6}
        colorScheme="blue"
        size="lg"
        width="full"
        onClick={handleSaveChanges}
        isDisabled={!hasUnsavedChanges}
      >
        Save Changes
      </Button>

      {/* Step Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {isEditing ? 'Edit Step' : 'Add New Step'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {currentStep && (
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>
                    Step Type
                    <Tooltip
                      label="The type of step determines its appearance and behavior in the onboarding wizard."
                      placement="top"
                      hasArrow
                    >
                      <Box as="span" ml={1} color="gray.500">
                        <FiInfo size={14} />
                      </Box>
                    </Tooltip>
                  </FormLabel>
                  <Select
                    name="type"
                    value={currentStep.type}
                    onChange={handleInputChange}
                    aria-label="Step type"
                  >
                    <option value="welcome">Welcome</option>
                    <option value="profile">User Profile</option>
                    <option value="ai_preferences">AI Preferences</option>
                    <option value="workspace">Workspace Setup</option>
                    <option value="tools">Tools & Integrations</option>
                    <option value="greeter">Greeter Agent</option>
                    <option value="completion">Completion</option>
                    <option value="custom">Custom Step</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Title</FormLabel>
                  <Input
                    name="title"
                    value={currentStep.title}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    name="description"
                    value={currentStep.description}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <HStack>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel mb="0">Enabled</FormLabel>
                    <Switch
                      isChecked={currentStep.enabled}
                      onChange={(e) => handleSwitchChange('enabled', e.target.checked)}
                    />
                  </FormControl>

                  <FormControl display="flex" alignItems="center">
                    <FormLabel mb="0">Required</FormLabel>
                    <Switch
                      isChecked={currentStep.required}
                      onChange={(e) => handleSwitchChange('required', e.target.checked)}
                    />
                  </FormControl>
                </HStack>

                <FormControl>
                  <FormLabel>
                    User Types
                    <Tooltip
                      label="Select which user types will see this step in their onboarding flow."
                      placement="top"
                      hasArrow
                    >
                      <Box as="span" ml={1} color="gray.500">
                        <FiInfo size={14} />
                      </Box>
                    </Tooltip>
                  </FormLabel>
                  <HStack spacing={4}>
                    <Button
                      size="sm"
                      colorScheme={currentStep.userTypes.includes('human') ? 'blue' : 'gray'}
                      onClick={() => handleUserTypeToggle('human')}
                    >
                      Human Users
                    </Button>
                    <Button
                      size="sm"
                      colorScheme={currentStep.userTypes.includes('ai_agent') ? 'blue' : 'gray'}
                      onClick={() => handleUserTypeToggle('ai_agent')}
                    >
                      AI Agents
                    </Button>
                  </HStack>
                  <FormHelperText>
                    Select which user types this step applies to. Steps can be shown to multiple user types.
                  </FormHelperText>
                </FormControl>

                <Divider my={2} />

                <Heading size="sm">Content Settings</Heading>

                <FormControl>
                  <FormLabel>Heading</FormLabel>
                  <Input
                    name="content.heading"
                    value={currentStep.content?.heading || ''}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Subheading</FormLabel>
                  <Textarea
                    name="content.subheading"
                    value={currentStep.content?.subheading || ''}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Image URL</FormLabel>
                  <Input
                    name="content.imageUrl"
                    value={currentStep.content?.imageUrl || ''}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Button Text</FormLabel>
                  <Input
                    name="content.buttonText"
                    value={currentStep.content?.buttonText || ''}
                    onChange={handleInputChange}
                  />
                </FormControl>

                {currentStep.type === 'custom' && (
                  <>
                    <Divider my={2} />
                    <Heading size="sm">Custom Fields</Heading>
                    <Text fontSize="sm" color="gray.500" mb={2}>
                      Custom fields configuration will be added in a future update.
                    </Text>
                  </>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSaveStep}>
              {isEditing ? 'Update Step' : 'Add Step'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};
