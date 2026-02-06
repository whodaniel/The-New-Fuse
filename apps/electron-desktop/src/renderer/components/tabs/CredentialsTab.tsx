/**
 * CredentialsTab - Secure Credentials Management UI
 *
 * Comprehensive credential management for AI providers, Google services,
 * MCP servers, and custom integrations with OS-level encryption.
 */

import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Spinner,
  Text,
  Tooltip,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FiAlertTriangle,
  FiBox,
  FiCheck,
  FiCode,
  FiDatabase,
  FiExternalLink,
  FiEye,
  FiEyeOff,
  FiKey,
  FiLink,
  FiLock,
  FiMessageSquare,
  FiPlus,
  FiRefreshCw,
  FiServer,
  FiShield,
  FiTrash2,
  FiUnlock,
} from 'react-icons/fi';
import {
  SiDiscord,
  SiFirebase,
  SiGithub,
  SiGoogle,
  SiMongodb,
  SiNotion,
  SiOpenai,
  SiRedis,
  SiSlack,
  SiStripe,
} from 'react-icons/si';
import type { AIProviderInfo, StoredCredential } from '../../../shared/types';

// Extended provider info type
interface ProviderInfo extends AIProviderInfo {
  id: string;
  category: string;
  description?: string;
  docsUrl?: string;
  isCustom?: boolean;
}

interface CategoryInfo {
  name: string;
  icon: string;
  description: string;
}

// Provider icons mapping
const providerIcons: Record<string, React.ComponentType<any>> = {
  openai: SiOpenai,
  google_ai: SiGoogle,
  google_oauth: SiGoogle,
  google_oauth_secret: SiGoogle,
  google_drive: SiGoogle,
  google_docs: SiGoogle,
  google_sheets: SiGoogle,
  youtube: SiGoogle,
  google_calendar: SiGoogle,
  google_gmail: SiGoogle,
  mcp_github: SiGithub,
  github: SiGithub,
  mcp_slack: SiSlack,
  mcp_notion: SiNotion,
  discord: SiDiscord,
  mongodb: SiMongodb,
  redis: SiRedis,
  firebase: SiFirebase,
  stripe: SiStripe,
  // Default icons by category
  ai: FiKey,
  google: SiGoogle,
  mcp: FiServer,
  blockchain: FiLink,
  database: FiDatabase,
  messaging: FiMessageSquare,
  devtools: FiCode,
  custom: FiBox,
};

// Category icons
const categoryIcons: Record<string, React.ComponentType<any>> = {
  ai: FiKey,
  google: SiGoogle,
  mcp: FiServer,
  blockchain: FiLink,
  database: FiDatabase,
  messaging: FiMessageSquare,
  devtools: FiCode,
  custom: FiBox,
};

// Category colors
const categoryColors: Record<string, string> = {
  ai: 'purple',
  google: 'blue',
  mcp: 'cyan',
  blockchain: 'orange',
  database: 'green',
  messaging: 'pink',
  devtools: 'yellow',
  custom: 'gray',
};

const cardStyle = {
  bg: 'rgba(255, 255, 255, 0.02)',
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 'xl',
};

interface CredentialWithStatus extends StoredCredential {
  hasKey: boolean;
  category: string;
}

interface SecureStorageStatusResponse {
  available: boolean;
  usingKeychain: boolean;
}

const CredentialsTab: React.FC = () => {
  const [credentials, setCredentials] = useState<CredentialWithStatus[]>([]);
  const [providers, setProviders] = useState<Record<string, ProviderInfo>>({});
  const [categories, setCategories] = useState<Record<string, CategoryInfo>>({});
  const [encryptionStatus, setEncryptionStatus] = useState<SecureStorageStatusResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [customName, setCustomName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingProvider, setDeletingProvider] = useState<string | null>(null);

  // Custom provider form
  const [customProviderId, setCustomProviderId] = useState('');
  const [customProviderName, setCustomProviderName] = useState('');
  const [customProviderEnvKey, setCustomProviderEnvKey] = useState('');
  const [customProviderCategory, setCustomProviderCategory] = useState<string>('custom');

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isCustomOpen, onOpen: onCustomOpen, onClose: onCustomClose } = useDisclosure();
  const toast = useToast();

  // Check if electronAPI is available
  const hasSecureStorage =
    typeof window !== 'undefined' && window.electronAPI?.secureStorage !== undefined;

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    if (!hasSecureStorage) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Load all data in parallel
      const [providersResult, credentialsResult, statusResult] = await Promise.all([
        window.electronAPI.secureStorage.providers(),
        window.electronAPI.secureStorage.list(),
        window.electronAPI.secureStorage.status(),
      ]);

      // Set providers (may need to fetch categories separately)
      setProviders(providersResult || {});
      setEncryptionStatus(statusResult);

      // Build categories from providers
      const cats: Record<string, CategoryInfo> = {};
      Object.values(providersResult || {}).forEach((p: any) => {
        if (p.category && !cats[p.category]) {
          cats[p.category] = {
            name: p.category.charAt(0).toUpperCase() + p.category.slice(1),
            icon: p.category,
            description: '',
          };
        }
      });
      setCategories(cats);

      // Merge credentials with hasKey status
      if (credentialsResult.success) {
        const credsWithStatus: CredentialWithStatus[] = credentialsResult.credentials.map(
          (cred: any) => ({
            ...cred,
            hasKey: true,
            category: cred.category || providersResult?.[cred.provider]?.category || 'custom',
          })
        );
        setCredentials(credsWithStatus);
      }
    } catch (error) {
      console.error('Failed to load credentials data:', error);
      toast({
        title: 'Error Loading Data',
        description: 'Failed to load credentials configuration.',
        status: 'error',
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [hasSecureStorage, toast]);

  const handleSaveKey = async () => {
    if (!selectedProvider || !apiKeyInput.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please select a provider and enter an API key.',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsSaving(true);
    try {
      const result = await window.electronAPI.secureStorage.save(
        selectedProvider,
        apiKeyInput.trim(),
        customName.trim() || undefined
      );

      if (result.success) {
        toast({
          title: 'Credential Saved',
          description: `Your ${providers[selectedProvider]?.name || selectedProvider} credential has been securely stored.`,
          status: 'success',
          duration: 3000,
        });

        // Reset form and reload
        setSelectedProvider('');
        setApiKeyInput('');
        setCustomName('');
        onClose();
        await loadData();
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: (error as Error).message,
        status: 'error',
        duration: 4000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteKey = async (provider: string) => {
    setDeletingProvider(provider);
    try {
      const result = await window.electronAPI.secureStorage.delete(provider);

      if (result.success) {
        toast({
          title: 'Credential Deleted',
          description: `The ${providers[provider]?.name || provider} credential has been removed.`,
          status: 'info',
          duration: 3000,
        });
        await loadData();
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: (error as Error).message,
        status: 'error',
        duration: 4000,
      });
    } finally {
      setDeletingProvider(null);
    }
  };

  const handleAddCustomProvider = async () => {
    if (!customProviderId || !customProviderName || !customProviderEnvKey) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    // Validate ID format
    if (!/^[a-z0-9_]+$/.test(customProviderId)) {
      toast({
        title: 'Invalid ID',
        description: 'Provider ID must only contain lowercase letters, numbers, and underscores.',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      // For now, we'll just add it directly to the providers list
      // In a full implementation, this would call addCustomProvider
      const newProvider: ProviderInfo = {
        id: customProviderId,
        name: customProviderName,
        envKey: customProviderEnvKey,
        category: customProviderCategory,
        placeholder: '',
        isCustom: true,
      };

      setProviders((prev) => ({
        ...prev,
        [customProviderId]: newProvider,
      }));

      toast({
        title: 'Custom Provider Added',
        description: `${customProviderName} has been added. You can now add its API key.`,
        status: 'success',
        duration: 3000,
      });

      // Reset form
      setCustomProviderId('');
      setCustomProviderName('');
      setCustomProviderEnvKey('');
      setCustomProviderCategory('custom');
      onCustomClose();
    } catch (error) {
      toast({
        title: 'Failed to Add Provider',
        description: (error as Error).message,
        status: 'error',
        duration: 4000,
      });
    }
  };

  const getProviderIcon = (provider: string, category?: string) => {
    const IconComponent = providerIcons[provider] || categoryIcons[category || 'custom'] || FiKey;
    return IconComponent;
  };

  // Get list of providers that don't have keys yet
  const availableProviders = Object.keys(providers).filter(
    (p) => !credentials.some((c) => c.provider === p)
  );

  // Filter providers by category
  const filteredProviders =
    selectedCategory === 'all'
      ? availableProviders
      : availableProviders.filter((p) => providers[p]?.category === selectedCategory);

  // Group credentials by category
  const groupedCredentials = credentials.reduce(
    (acc, cred) => {
      const cat = cred.category || 'custom';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(cred);
      return acc;
    },
    {} as Record<string, CredentialWithStatus[]>
  );

  if (!hasSecureStorage) {
    return (
      <Box p={6}>
        <Alert status="warning" borderRadius="xl" {...cardStyle}>
          <AlertIcon />
          <Box>
            <AlertTitle>Secure Storage Not Available</AlertTitle>
            <AlertDescription>
              Credential management is only available in the Electron desktop app. Please run the
              app using Electron to access this feature.
            </AlertDescription>
          </Box>
        </Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Flex h="300px" align="center" justify="center">
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.400" />
          <Text color="whiteAlpha.600">Loading Credentials...</Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <VStack align="stretch" spacing={6} p={6}>
      {/* Header */}
      <HStack justify="space-between" align="center">
        <Box>
          <HStack spacing={3} mb={1}>
            <Box p={2} borderRadius="lg" bg="rgba(6, 182, 212, 0.1)">
              <Icon as={FiKey} boxSize={6} color="cyan.400" />
            </Box>
            <Heading
              fontSize="2xl"
              fontWeight="700"
              bgGradient="linear(to-r, #60a5fa, #a78bfa, #f472b6)"
              bgClip="text"
            >
              Credentials & API Keys
            </Heading>
          </HStack>
          <Text color="whiteAlpha.600" fontSize="sm">
            Securely manage API keys for AI, Google services, MCP servers, and more
          </Text>
        </Box>
        <HStack spacing={3}>
          <Tooltip label="Refresh">
            <IconButton
              aria-label="Refresh"
              icon={<FiRefreshCw />}
              variant="outline"
              size="sm"
              onClick={loadData}
            />
          </Tooltip>
          <Button leftIcon={<FiBox />} variant="outline" size="sm" onClick={onCustomOpen}>
            Custom Provider
          </Button>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="brand"
            size="sm"
            onClick={onOpen}
            isDisabled={availableProviders.length === 0}
          >
            Add Credential
          </Button>
        </HStack>
      </HStack>

      {/* Encryption Status */}
      <Alert
        status={encryptionStatus?.available ? 'success' : 'warning'}
        borderRadius="xl"
        {...cardStyle}
      >
        <AlertIcon as={encryptionStatus?.available ? FiShield : FiAlertTriangle} />
        <Box flex="1">
          <AlertTitle fontSize="sm">
            {encryptionStatus?.available ? 'Secure Storage Active' : 'Limited Security'}
          </AlertTitle>
          <AlertDescription fontSize="xs" color="whiteAlpha.700">
            {encryptionStatus?.available
              ? "Your credentials are encrypted using your operating system's secure keychain."
              : 'OS-level encryption is not available. Keys will be stored with basic encoding.'}
          </AlertDescription>
        </Box>
        <Badge colorScheme={encryptionStatus?.available ? 'green' : 'yellow'} fontSize="10px">
          {encryptionStatus?.usingKeychain ? 'Keychain' : 'Fallback'}
        </Badge>
      </Alert>

      {/* Category Quick Stats */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
        {Object.entries(categoryColors)
          .slice(0, 4)
          .map(([cat, color]) => {
            const count = groupedCredentials[cat]?.length || 0;
            const CatIcon = categoryIcons[cat] || FiKey;
            return (
              <Box key={cat} {...cardStyle} p={3}>
                <HStack justify="space-between">
                  <HStack spacing={2}>
                    <Icon as={CatIcon} color={`${color}.400`} />
                    <Text fontSize="xs" textTransform="capitalize" color="whiteAlpha.700">
                      {cat}
                    </Text>
                  </HStack>
                  <Badge colorScheme={color} fontSize="10px">
                    {count} stored
                  </Badge>
                </HStack>
              </Box>
            );
          })}
      </SimpleGrid>

      {/* Stored Credentials by Category */}
      {credentials.length > 0 ? (
        <Accordion allowMultiple defaultIndex={[0]}>
          {Object.entries(groupedCredentials).map(([category, creds]) => {
            const CatIcon = categoryIcons[category] || FiKey;
            const color = categoryColors[category] || 'gray';

            return (
              <AccordionItem key={category} border="none" mb={2}>
                <AccordionButton
                  {...cardStyle}
                  _hover={{ bg: 'whiteAlpha.100' }}
                  borderRadius="xl"
                  p={4}
                >
                  <HStack flex="1" spacing={3}>
                    <Icon as={CatIcon} color={`${color}.400`} boxSize={5} />
                    <Text fontWeight="600" textTransform="capitalize">
                      {category.replace('_', ' ')}
                    </Text>
                    <Badge colorScheme={color}>{creds.length}</Badge>
                  </HStack>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pt={4} pb={0}>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    {creds.map((cred) => (
                      <Box
                        key={cred.id}
                        {...cardStyle}
                        p={4}
                        transition="all 0.2s"
                        _hover={{ borderColor: 'whiteAlpha.200' }}
                      >
                        <HStack justify="space-between" align="start">
                          <HStack spacing={3}>
                            <Box p={2} borderRadius="lg" bg={`${color}.900`}>
                              <Icon
                                as={getProviderIcon(cred.provider, category)}
                                boxSize={4}
                                color={`${color}.400`}
                              />
                            </Box>
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="600" fontSize="sm">
                                {cred.name}
                              </Text>
                              <Text fontSize="xs" color="whiteAlpha.500">
                                {providers[cred.provider]?.envKey || cred.provider}
                              </Text>
                            </VStack>
                          </HStack>
                          <HStack spacing={2}>
                            <Badge colorScheme="green" fontSize="9px">
                              <HStack spacing={1}>
                                <Icon as={FiLock} boxSize={2.5} />
                                <Text>Stored</Text>
                              </HStack>
                            </Badge>
                            {providers[cred.provider]?.docsUrl && (
                              <Tooltip label="View Docs">
                                <IconButton
                                  aria-label="Docs"
                                  icon={<FiExternalLink />}
                                  size="xs"
                                  variant="ghost"
                                  onClick={() =>
                                    window.open(providers[cred.provider].docsUrl, '_blank')
                                  }
                                />
                              </Tooltip>
                            )}
                            <Tooltip label="Delete">
                              <IconButton
                                aria-label="Delete"
                                icon={<FiTrash2 />}
                                size="xs"
                                variant="ghost"
                                colorScheme="red"
                                isLoading={deletingProvider === cred.provider}
                                onClick={() => handleDeleteKey(cred.provider)}
                              />
                            </Tooltip>
                          </HStack>
                        </HStack>
                        {cred.updatedAt && (
                          <Text mt={2} fontSize="10px" color="whiteAlpha.400">
                            Updated: {new Date(cred.updatedAt).toLocaleDateString()}
                          </Text>
                        )}
                      </Box>
                    ))}
                  </SimpleGrid>
                </AccordionPanel>
              </AccordionItem>
            );
          })}
        </Accordion>
      ) : (
        <Box {...cardStyle} p={8} textAlign="center">
          <VStack spacing={4}>
            <Icon as={FiUnlock} boxSize={12} color="whiteAlpha.300" />
            <VStack spacing={1}>
              <Text fontWeight="600" color="whiteAlpha.700">
                No Credentials Stored
              </Text>
              <Text fontSize="sm" color="whiteAlpha.500">
                Add your first credential to start using integrated services securely.
              </Text>
            </VStack>
            <Button leftIcon={<FiPlus />} colorScheme="brand" size="sm" onClick={onOpen}>
              Add Your First Credential
            </Button>
          </VStack>
        </Box>
      )}

      {/* Add Credential Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent bg="#0f172a" border="1px solid rgba(255, 255, 255, 0.1)">
          <ModalHeader>
            <HStack spacing={3}>
              <Icon as={FiKey} color="cyan.400" />
              <Text>Add Credential</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={5}>
              {/* Category Filter */}
              <FormControl>
                <FormLabel>Category</FormLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedProvider('');
                  }}
                  bg="whiteAlpha.50"
                  border="1px solid"
                  borderColor="whiteAlpha.100"
                >
                  <option value="all" style={{ background: '#1e293b' }}>
                    All Categories
                  </option>
                  {Object.entries(categoryColors).map(([cat, color]) => (
                    <option key={cat} value={cat} style={{ background: '#1e293b' }}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Service / Provider</FormLabel>
                <Select
                  placeholder="Select a service"
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  bg="whiteAlpha.50"
                  border="1px solid"
                  borderColor="whiteAlpha.100"
                >
                  {filteredProviders.map((key) => (
                    <option key={key} value={key} style={{ background: '#1e293b' }}>
                      {providers[key]?.name || key}
                      {providers[key]?.description &&
                        ` - ${providers[key].description.slice(0, 30)}...`}
                    </option>
                  ))}
                </Select>
                {selectedProvider && providers[selectedProvider]?.description && (
                  <FormHelperText color="whiteAlpha.600">
                    {providers[selectedProvider].description}
                  </FormHelperText>
                )}
              </FormControl>

              <FormControl isRequired>
                <FormLabel>API Key / Secret</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={
                      selectedProvider
                        ? providers[selectedProvider]?.placeholder || 'Enter your API key'
                        : 'Select a provider first'
                    }
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    bg="whiteAlpha.50"
                    border="1px solid"
                    borderColor="whiteAlpha.100"
                    fontFamily="mono"
                    isDisabled={!selectedProvider}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showPassword ? 'Hide' : 'Show'}
                      icon={showPassword ? <FiEyeOff /> : <FiEye />}
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowPassword(!showPassword)}
                    />
                  </InputRightElement>
                </InputGroup>
                <FormHelperText color="whiteAlpha.500">
                  Environment variable: {selectedProvider && providers[selectedProvider]?.envKey}
                </FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Custom Label (Optional)</FormLabel>
                <Input
                  placeholder="e.g., Work Account, Personal"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  bg="whiteAlpha.50"
                  border="1px solid"
                  borderColor="whiteAlpha.100"
                />
              </FormControl>

              {selectedProvider && providers[selectedProvider]?.docsUrl && (
                <Alert status="info" borderRadius="lg" bg="rgba(59, 130, 246, 0.1)">
                  <AlertIcon />
                  <Box flex="1">
                    <Text fontSize="sm" color="whiteAlpha.800">
                      Need an API key?{' '}
                      <Link href={providers[selectedProvider].docsUrl} isExternal color="cyan.400">
                        Get one here <Icon as={FiExternalLink} mx="2px" />
                      </Link>
                    </Text>
                  </Box>
                </Alert>
              )}

              <Alert status="success" borderRadius="lg" bg="rgba(72, 187, 120, 0.1)">
                <AlertIcon as={FiShield} />
                <Text fontSize="sm" color="whiteAlpha.800">
                  Credentials are encrypted locally and never sent to external servers.
                </Text>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              leftIcon={<FiCheck />}
              onClick={handleSaveKey}
              isLoading={isSaving}
              isDisabled={!selectedProvider || !apiKeyInput.trim()}
            >
              Save Securely
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Custom Provider Modal */}
      <Modal isOpen={isCustomOpen} onClose={onCustomClose} size="lg">
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent bg="#0f172a" border="1px solid rgba(255, 255, 255, 0.1)">
          <ModalHeader>
            <HStack spacing={3}>
              <Icon as={FiBox} color="purple.400" />
              <Text>Add Custom Provider</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Provider ID</FormLabel>
                <Input
                  placeholder="e.g., my_custom_api"
                  value={customProviderId}
                  onChange={(e) =>
                    setCustomProviderId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))
                  }
                  bg="whiteAlpha.50"
                  border="1px solid"
                  borderColor="whiteAlpha.100"
                  fontFamily="mono"
                />
                <FormHelperText color="whiteAlpha.500">
                  Lowercase letters, numbers, and underscores only
                </FormHelperText>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Display Name</FormLabel>
                <Input
                  placeholder="e.g., My Custom API"
                  value={customProviderName}
                  onChange={(e) => setCustomProviderName(e.target.value)}
                  bg="whiteAlpha.50"
                  border="1px solid"
                  borderColor="whiteAlpha.100"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Environment Variable</FormLabel>
                <Input
                  placeholder="e.g., MY_CUSTOM_API_KEY"
                  value={customProviderEnvKey}
                  onChange={(e) =>
                    setCustomProviderEnvKey(
                      e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_')
                    )
                  }
                  bg="whiteAlpha.50"
                  border="1px solid"
                  borderColor="whiteAlpha.100"
                  fontFamily="mono"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Category</FormLabel>
                <Select
                  value={customProviderCategory}
                  onChange={(e) => setCustomProviderCategory(e.target.value)}
                  bg="whiteAlpha.50"
                  border="1px solid"
                  borderColor="whiteAlpha.100"
                >
                  {Object.keys(categoryColors).map((cat) => (
                    <option key={cat} value={cat} style={{ background: '#1e293b' }}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCustomClose}>
              Cancel
            </Button>
            <Button
              colorScheme="purple"
              leftIcon={<FiPlus />}
              onClick={handleAddCustomProvider}
              isDisabled={!customProviderId || !customProviderName || !customProviderEnvKey}
            >
              Add Provider
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default CredentialsTab;
