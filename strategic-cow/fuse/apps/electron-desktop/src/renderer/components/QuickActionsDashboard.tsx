import {
  Box,
  Button,
  Code,
  Collapse,
  CollapseProps,
  HStack,
  Icon,
  SimpleGrid,
  Text,
  useColorModeValue,
  useToast,
  VStack,
} from '@chakra-ui/react';
import React, { useState } from 'react';
import {
  FiChevronDown,
  FiChevronRight,
  FiCpu,
  FiDatabase,
  FiGithub,
  FiGlobe,
  FiPlay,
  FiServer,
  FiTerminal,
  FiZap,
} from 'react-icons/fi';

// Workaround for React types conflict with Chakra UI Collapse
const TypedCollapse = Collapse as React.FC<CollapseProps & { children?: React.ReactNode }>;

// Services/Categories
const ACTION_CATEGORIES = [
  {
    name: 'AI Agents',
    icon: FiCpu,
    description: 'Manage AI agents and multi-agent conversations',
    actions: [
      {
        id: 'join-network',
        label: 'Join Agent Network',
        icon: '🔗',
        description: 'Register this app as an agent on the Redis network',
        command: 'node scripts/tnf-agent-cli.cjs register electron-app participant electron',
      },
      {
        id: 'view-agents',
        label: 'View Active Agents',
        icon: '👥',
        description: 'See all AI agents currently connected',
        command: 'node scripts/tnf-agent-cli.cjs list',
      },
      {
        id: 'start-conversation',
        label: 'Start AI Conversation',
        icon: '💬',
        description: 'Begin a new multi-AI conversation',
        command: 'node scripts/tnf-agent-cli.cjs convo start general',
      },
    ],
  },
  {
    name: 'Copilot & Context',
    icon: FiZap,
    description: 'Constant AI context awareness and analysis',
    actions: [
      {
        id: 'start-copilot',
        label: 'Start Copilot Loop',
        icon: '👁️',
        description: 'Enable constant screen analysis loop',
        apiMethod: 'copilotStart',
      },
      {
        id: 'stop-copilot',
        label: 'Stop Copilot Loop',
        icon: '🛑',
        description: 'Disable screen analysis',
        apiMethod: 'copilotStop',
      },
      {
        id: 'copilot-status',
        label: 'Check Status',
        icon: '❓',
        description: 'Check if copilot is active',
        apiMethod: 'copilotStatus',
      },
    ],
  },
  {
    name: 'External Tools',
    icon: FiGlobe,
    description: 'Open external TNF tools and services',
    actions: [
      {
        id: 'open-theia',
        label: 'Open Theia IDE',
        icon: '💻',
        description: 'Open the cloud-based Theia IDE',
        url: 'https://tnf-theia-ide-production.up.railway.app',
      },
      {
        id: 'open-website',
        label: 'Open TNF Website',
        icon: '🌍',
        description: 'Open the main TNF website',
        url: 'https://thenewfuse.com',
      },
      {
        id: 'open-github',
        label: 'Open GitHub',
        icon: FiGithub,
        description: 'View the TNF GitHub repository',
        url: 'https://github.com/whodaniel/fuse',
      },
      {
        id: 'open-railway',
        label: 'Railway Dashboard',
        icon: '🚂',
        description: 'Manage Railway deployments',
        url: 'https://railway.app/dashboard',
      },
    ],
  },
  {
    name: 'Development',
    icon: FiServer,
    description: 'Start and manage development services',
    actions: [
      {
        id: 'start-dev',
        label: 'Start Dev Server',
        icon: '▶️',
        description: 'Start all development services',
        command: 'pnpm run dev',
      },
      {
        id: 'start-redis',
        label: 'Start Redis',
        icon: FiDatabase,
        description: 'Ensure Redis server is running',
        command: 'redis-server',
      },
    ],
  },
];

export const QuickActionsDashboard: React.FC = () => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('AI Agents');
  const [isExecuting, setIsExecuting] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [results, setResults] = useState<Map<string, any>>(new Map());
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState('');
  const toast = useToast();

  const bg = useColorModeValue('whiteAlpha.50', 'whiteAlpha.50');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');

  const toggleCategory = (name: string) => {
    setExpandedCategory((prev) => (prev === name ? null : name));
  };

  const executeAction = async (action: any) => {
    setIsExecuting(action.id);

    try {
      if (action.url) {
        if (window.api) {
          await window.api.openExternal(action.url);
        } else {
          window.open(action.url, '_blank');
        }
        toast({ title: 'Opened Link', status: 'success', duration: 2000 });
      } else if (action.apiMethod) {
        if (window.api && (window.api as any)[action.apiMethod]) {
          const res = await (window.api as any)[action.apiMethod]();
          if (res.success) {
            toast({
              title: 'Success',
              description: `Action ${action.label} completed`,
              status: 'success',
            });
          } else {
            toast({ title: 'Error', description: res.error || 'Action failed', status: 'error' });
          }
        } else {
          toast({ title: 'API Not Available', status: 'error' });
        }
      } else if (action.command) {
        if (window.api) {
          // naive splitting of command
          const [cmd, ...args] = action.command.split(' ');
          const response = await window.api.nativeExecute(cmd, args);

          const output = response.data?.output || response.error || 'Command executed';
          setTerminalOutput((prev) => prev + `\n$ ${action.command}\n${output}\n`);

          if (response.success) {
            toast({ title: 'Command Executed', status: 'success', duration: 2000 });
          } else {
            toast({
              title: 'Command Failed',
              description: output,
              status: 'error',
              duration: 4000,
            });
          }
        } else {
          toast({ title: 'API Not Available', status: 'error' });
        }
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, status: 'error' });
    } finally {
      setIsExecuting(null);
    }
  };

  return (
    <Box p={6} h="100%" overflowY="auto">
      <VStack align="stretch" spacing={6}>
        {/* Header */}
        <Box>
          <HStack spacing={3} mb={2}>
            <Icon as={FiZap} boxSize={8} color="yellow.400" />
            <Text fontSize="3xl" fontWeight="bold">
              Quick Actions
            </Text>
          </HStack>
          <Text color="gray.400">
            One-click access to all TNF features. No command line required!
          </Text>
        </Box>

        {/* Categories */}
        <VStack align="stretch" spacing={4}>
          {ACTION_CATEGORIES.map((category) => (
            <Box
              key={category.name}
              bg={bg}
              borderRadius="lg"
              border="1px solid"
              borderColor={borderColor}
              overflow="hidden"
            >
              <Button
                w="100%"
                variant="ghost"
                p={6}
                h="auto"
                justifyContent="space-between"
                onClick={() => toggleCategory(category.name)}
                _hover={{ bg: 'whiteAlpha.100' }}
              >
                <HStack spacing={4}>
                  <Icon as={category.icon} boxSize={6} color="brand.400" />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="lg" fontWeight="bold">
                      {category.name}
                    </Text>
                    <Text fontSize="sm" color="gray.400" fontWeight="normal">
                      {category.description}
                    </Text>
                  </VStack>
                </HStack>
                <Icon
                  as={expandedCategory === category.name ? FiChevronDown : FiChevronRight}
                  color="gray.500"
                />
              </Button>

              <TypedCollapse in={expandedCategory === category.name}>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} p={4} pt={0}>
                  {category.actions.map((action) => (
                    <Button
                      key={action.id}
                      variant="outline"
                      h="auto"
                      p={4}
                      justifyContent="flex-start"
                      alignItems="flex-start"
                      bg="blackAlpha.200"
                      borderColor="whiteAlpha.100"
                      _hover={{ bg: 'whiteAlpha.100', borderColor: 'brand.400' }}
                      onClick={() => executeAction(action)}
                      isLoading={isExecuting === action.id}
                      loadingText="Running..."
                    >
                      <HStack align="start" spacing={3} w="100%">
                        <Box mt={1}>
                          {typeof action.icon === 'string' ? (
                            <Text>{action.icon}</Text>
                          ) : (
                            <Icon as={action.icon} />
                          )}
                        </Box>
                        <VStack align="start" spacing={1} flex={1}>
                          <Text fontWeight="bold" fontSize="sm">
                            {action.label}
                          </Text>
                          <Text fontSize="xs" color="gray.400" whiteSpace="normal" textAlign="left">
                            {action.description}
                          </Text>
                        </VStack>
                        {(action.command || action.apiMethod) && (
                          <Icon as={FiPlay} boxSize={3} color="gray.600" />
                        )}
                      </HStack>
                    </Button>
                  ))}
                </SimpleGrid>
              </TypedCollapse>
            </Box>
          ))}
        </VStack>

        {/* Terminal Toggle */}
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Icon as={FiTerminal} />}
          onClick={() => setShowTerminal(!showTerminal)}
          alignSelf="flex-start"
        >
          {showTerminal ? 'Hide Terminal Output' : 'Show Terminal Output'}
        </Button>

        {showTerminal && (
          <Box
            bg="blackAlpha.800"
            p={4}
            borderRadius="md"
            fontFamily="mono"
            fontSize="xs"
            maxH="200px"
            overflowY="auto"
          >
            <Code bg="transparent" display="block" color="green.300">
              {terminalOutput || 'No output yet...'}
            </Code>
          </Box>
        )}
      </VStack>
    </Box>
  );
};
