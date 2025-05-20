import React, { useState, useEffect } from 'react';
import { OnboardingAdminService } from '../../../services/onboarding-admin.service.js';
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
  Switch,
  Input,
  Textarea,
  Select,
  IconButton,
  Divider,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormHelperText,
  useToast,
  Spinner,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';

interface UserType {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  detectionMethod: 'header' | 'auth' | 'behavior' | 'manual';
  detectionConfig: {
    headerName?: string;
    headerValue?: string;
    authType?: string;
    behaviorPattern?: string;
  };
  onboardingFlow: string;
  priority: number;
}

interface OnboardingUserTypesProps {
  onSave: () => void;
  onChange: () => void;
  hasUnsavedChanges: boolean;
}

export const OnboardingUserTypes: React.FC<OnboardingUserTypesProps> = ({
  onSave,
  onChange,
  hasUnsavedChanges
}) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userTypes, setUserTypes] = useState<UserType[]>([]);

  const [editingUserType, setEditingUserType] = useState<UserType | null>(null);
  const [isNewUserType, setIsNewUserType] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();

  // Fetch user types from API
  useEffect(() => {
    const fetchUserTypes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await OnboardingAdminService.getUserTypes();
        setUserTypes(data);
      } catch (err) {
        console.error('Error fetching user types:', err);
        setError('Failed to load user types. Please try again.');
        // Set default user types if API fails
        setUserTypes([
          {
            id: 'human',
            name: 'Human User',
            description: 'Regular human users of the platform',
            enabled: true,
            detectionMethod: 'behavior',
            detectionConfig: {
              behaviorPattern: 'human-like interaction patterns'
            },
            onboardingFlow: 'human-onboarding',
            priority: 10
          },
          {
            id: 'ai_agent',
            name: 'AI Agent',
            description: 'AI agents that integrate with the platform',
            enabled: true,
            detectionMethod: 'header',
            detectionConfig: {
              headerName: 'X-Agent-Type',
              headerValue: 'ai_agent'
            },
            onboardingFlow: 'ai-agent-onboarding',
            priority: 20
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserTypes();
  }, []);

  const cardBg = useColorModeValue('white', 'gray.700');

  // Handle edit user type
  const handleEditUserType = (userType: UserType) => {
    setEditingUserType({ ...userType });
    setIsNewUserType(false);
    onOpen();
  };

  // Handle add new user type
  const handleAddUserType = () => {
    setEditingUserType({
      id: '',
      name: '',
      description: '',
      enabled: true,
      detectionMethod: 'header',
      detectionConfig: {},
      onboardingFlow: '',
      priority: userTypes.length + 10
    });
    setIsNewUserType(true);
    onOpen();
  };

  // Handle delete user type
  const handleDeleteUserType = (id: string) => {
    if (window.confirm('Are you sure you want to delete this user type?')) {
      setUserTypes(userTypes.filter(ut => ut.id !== id));
      onChange();
    }
  };

  // Handle save user type
  const handleSaveUserType = () => {
    if (!editingUserType) return;

    if (isNewUserType) {
      setUserTypes([...userTypes, editingUserType]);
    } else {
      setUserTypes(userTypes.map(ut => ut.id === editingUserType.id ? editingUserType : ut));
    }

    onChange();
    onClose();
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editingUserType) return;

    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setEditingUserType({ ...editingUserType, [name]: checked });
    } else if (name.startsWith('detectionConfig.')) {
      const configKey = name.split('.')[1];
      setEditingUserType({
        ...editingUserType,
        detectionConfig: {
          ...editingUserType.detectionConfig,
          [configKey]: value
        }
      });
    } else {
      setEditingUserType({ ...editingUserType, [name]: value });
    }
  };

  // Handle detection method change
  const handleDetectionMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!editingUserType) return;

    const method = e.target.value as 'header' | 'auth' | 'behavior' | 'manual';

    // Reset detection config when method changes
    let detectionConfig = {};

    switch (method) {
      case 'header':
        detectionConfig = { headerName: '', headerValue: '' };
        break;
      case 'auth':
        detectionConfig = { authType: '' };
        break;
      case 'behavior':
        detectionConfig = { behaviorPattern: '' };
        break;
      case 'manual':
        detectionConfig = {};
        break;
    }

    setEditingUserType({
      ...editingUserType,
      detectionMethod: method,
      detectionConfig
    });
  };

  // Handle save all changes
  const handleSaveChanges = async () => {
    try {
      await OnboardingAdminService.updateUserTypes(userTypes);
      onSave();

      toast({
        title: 'User types saved',
        description: 'User types have been saved successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error saving user types:', err);

      toast({
        title: 'Error saving user types',
        description: 'There was an error saving your changes. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Get detection method display text
  const getDetectionMethodDisplay = (userType: UserType) => {
    switch (userType.detectionMethod) {
      case 'header':
        return `Header: ${userType.detectionConfig.headerName}`;
      case 'auth':
        return `Auth Type: ${userType.detectionConfig.authType}`;
      case 'behavior':
        return 'Behavior Analysis';
      case 'manual':
        return 'Manual Selection';
      default:
        return 'Unknown';
    }
  };

  return (
    <Box>
      {isLoading && (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" mb={4} />
          <Text>Loading user types...</Text>
        </Box>
      )}

      {error && !isLoading && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          <Box flex="1">
            <Text fontWeight="bold">Error Loading User Types</Text>
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
        <Card bg={cardBg}>
          <CardHeader pb={0}>
            <HStack justifyContent="space-between">
              <Heading size="md">User Types</Heading>
              <Button
                leftIcon={<FiPlus />}
                colorScheme="blue"
                size="sm"
                onClick={handleAddUserType}
              >
                Add User Type
              </Button>
            </HStack>
          </CardHeader>
          <CardBody>
            <Text mb={4}>
              Configure the different types of users that can access the platform. Each user type can have its own onboarding flow.
            </Text>

            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Detection Method</Th>
                  <Th>Onboarding Flow</Th>
                  <Th>Status</Th>
                  <Th>Priority</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {userTypes.map((userType) => (
                  <Tr key={userType.id}>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium">{userType.name}</Text>
                        <Text fontSize="sm" color="gray.500">{userType.description}</Text>
                      </VStack>
                    </Td>
                    <Td>{getDetectionMethodDisplay(userType)}</Td>
                    <Td>{userType.onboardingFlow}</Td>
                    <Td>
                      <Badge colorScheme={userType.enabled ? 'green' : 'gray'}>
                        {userType.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </Td>
                    <Td>{userType.priority}</Td>
                    <Td>
                      <HStack>
                        <IconButton
                          aria-label="Edit user type"
                          icon={<FiEdit2 />}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditUserType(userType)}
                        />
                        <IconButton
                          aria-label="Delete user type"
                          icon={<FiTrash2 />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleDeleteUserType(userType.id)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>

        <Card bg={cardBg}>
          <CardHeader pb={0}>
            <Heading size="md">User Type Detection</Heading>
          </CardHeader>
          <CardBody>
            <Text mb={4}>
              Configure how the system detects different user types. User types are evaluated in order of priority (highest first).
            </Text>

            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center">
                <Switch
                  id="enable-auto-detection"
                  isChecked={true}
                  colorScheme="blue"
                />
                <FormLabel htmlFor="enable-auto-detection" mb={0} ml={2}>
                  Enable automatic user type detection
                </FormLabel>
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <Switch
                  id="allow-manual-override"
                  isChecked={true}
                  colorScheme="blue"
                />
                <FormLabel htmlFor="allow-manual-override" mb={0} ml={2}>
                  Allow users to manually select their type
                </FormLabel>
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <Switch
                  id="remember-user-type"
                  isChecked={true}
                  colorScheme="blue"
                />
                <FormLabel htmlFor="remember-user-type" mb={0} ml={2}>
                  Remember user type between sessions
                </FormLabel>
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        <Divider />

        <HStack justifyContent="flex-end">
          <Button
            colorScheme="blue"
            onClick={handleSaveChanges}
            isDisabled={!hasUnsavedChanges}
          >
            Save Changes
          </Button>
        </HStack>
      </VStack>
      )}

      {/* Edit User Type Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {isNewUserType ? 'Add User Type' : 'Edit User Type'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editingUserType && (
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>ID</FormLabel>
                  <Input
                    name="id"
                    value={editingUserType.id}
                    onChange={handleInputChange}
                    placeholder="e.g., human, ai_agent"
                    isReadOnly={!isNewUserType}
                  />
                  <FormHelperText>
                    Unique identifier for this user type
                  </FormHelperText>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input
                    name="name"
                    value={editingUserType.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Human User, AI Agent"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    name="description"
                    value={editingUserType.description}
                    onChange={handleInputChange}
                    placeholder="Describe this user type"
                    rows={2}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <Switch
                    id="user-type-enabled"
                    name="enabled"
                    isChecked={editingUserType.enabled}
                    onChange={(e) => setEditingUserType({
                      ...editingUserType,
                      enabled: e.target.checked
                    })}
                    colorScheme="blue"
                  />
                  <FormLabel htmlFor="user-type-enabled" mb={0} ml={2}>
                    Enabled
                  </FormLabel>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Detection Method</FormLabel>
                  <Select
                    name="detectionMethod"
                    value={editingUserType.detectionMethod}
                    onChange={handleDetectionMethodChange}
                    aria-label="Detection method"
                  >
                    <option value="header">HTTP Header</option>
                    <option value="auth">Authentication Type</option>
                    <option value="behavior">Behavior Analysis</option>
                    <option value="manual">Manual Selection</option>
                  </Select>
                </FormControl>

                {/* Detection Config based on method */}
                {editingUserType.detectionMethod === 'header' && (
                  <VStack spacing={3} align="stretch">
                    <FormControl isRequired>
                      <FormLabel>Header Name</FormLabel>
                      <Input
                        name="detectionConfig.headerName"
                        value={editingUserType.detectionConfig.headerName || ''}
                        onChange={handleInputChange}
                        placeholder="e.g., X-Agent-Type"
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Header Value</FormLabel>
                      <Input
                        name="detectionConfig.headerValue"
                        value={editingUserType.detectionConfig.headerValue || ''}
                        onChange={handleInputChange}
                        placeholder="e.g., ai_agent"
                      />
                    </FormControl>
                  </VStack>
                )}

                {editingUserType.detectionMethod === 'auth' && (
                  <FormControl isRequired>
                    <FormLabel>Authentication Type</FormLabel>
                    <Input
                      name="detectionConfig.authType"
                      value={editingUserType.detectionConfig.authType || ''}
                      onChange={handleInputChange}
                      placeholder="e.g., api_key, oauth, password"
                    />
                  </FormControl>
                )}

                {editingUserType.detectionMethod === 'behavior' && (
                  <FormControl isRequired>
                    <FormLabel>Behavior Pattern</FormLabel>
                    <Input
                      name="detectionConfig.behaviorPattern"
                      value={editingUserType.detectionConfig.behaviorPattern || ''}
                      onChange={handleInputChange}
                      placeholder="e.g., human-like interaction patterns"
                    />
                    <FormHelperText>
                      This is a simplified representation. In a real implementation, behavior patterns would be configured more extensively.
                    </FormHelperText>
                  </FormControl>
                )}

                <FormControl isRequired>
                  <FormLabel>Onboarding Flow</FormLabel>
                  <Input
                    name="onboardingFlow"
                    value={editingUserType.onboardingFlow}
                    onChange={handleInputChange}
                    placeholder="e.g., human-onboarding, ai-agent-onboarding"
                  />
                  <FormHelperText>
                    The ID of the onboarding flow to use for this user type
                  </FormHelperText>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Priority</FormLabel>
                  <Input
                    name="priority"
                    type="number"
                    value={editingUserType.priority}
                    onChange={handleInputChange}
                    placeholder="e.g., 10"
                  />
                  <FormHelperText>
                    Higher priority user types are evaluated first during detection
                  </FormHelperText>
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSaveUserType}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};
