import {
  Badge,
  Box,
  Button,
  HStack,
  Icon,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import React from 'react';
import {
  FiActivity,
  FiBox,
  FiChevronLeft,
  FiChevronRight,
  FiCpu,
  FiHome,
  FiMessageSquare,
  FiSettings,
  FiTerminal,
} from 'react-icons/fi';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  section: 'main' | 'tools' | 'system';
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: FiHome, section: 'main' },
  { id: 'console', label: 'Console', icon: FiTerminal, section: 'main' },
  { id: 'agents', label: 'Agent Hub', icon: FiCpu, section: 'main' },
  { id: 'chat', label: 'Chat', icon: FiMessageSquare, section: 'main' },
  { id: 'analytics', label: 'Analytics', icon: FiActivity, section: 'tools' },
  { id: 'mcp', label: 'MCP Market', icon: FiBox, section: 'tools' },
  { id: 'settings', label: 'Settings', icon: FiSettings, section: 'system' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  collapsed,
  onToggleCollapse,
}) => {
  const bg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');

  const renderNavSection = (section: string, items: NavItem[]) => {
    return (
      <VStack align="stretch" spacing={1} mb={4}>
        {!collapsed && (
          <Text
            fontSize="xs"
            fontWeight="bold"
            textTransform="uppercase"
            color="gray.500"
            px={3}
            mb={2}
          >
            {section}
          </Text>
        )}
        {items.map((item) => (
          <Button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            variant="ghost"
            justifyContent={collapsed ? 'center' : 'flex-start'}
            isActive={currentView === item.id}
            leftIcon={<Icon as={item.icon} boxSize={5} />}
            iconSpacing={collapsed ? 0 : 3}
            size="md"
            _active={{
              bg: 'brand.500',
              color: 'white',
              boxShadow: 'md',
            }}
            title={collapsed ? item.label : undefined}
          >
            {!collapsed && item.label}
          </Button>
        ))}
      </VStack>
    );
  };

  return (
    <Box
      w={collapsed ? '72px' : '260px'}
      h="100vh"
      bg="whiteAlpha.50"
      backdropFilter="blur(24px)"
      borderRight="1px solid"
      borderColor={borderColor}
      transition="width 0.3s ease"
      display="flex"
      flexDirection="column"
      zIndex={100}
    >
      {/* Header */}
      <HStack
        h="64px"
        px={collapsed ? 2 : 4}
        justify="space-between"
        borderBottom="1px solid"
        borderColor={borderColor}
      >
        <HStack spacing={3} justify={collapsed ? 'center' : 'flex-start'} w="100%">
          <Text fontSize="2xl">🔥</Text>
          {!collapsed && (
            <Text
              fontSize="lg"
              fontWeight="bold"
              bgGradient="linear(to-r, brand.300, brand.500)"
              bgClip="text"
            >
              The New Fuse
            </Text>
          )}
        </HStack>
        {!collapsed && (
          <Button size="xs" variant="ghost" onClick={onToggleCollapse}>
            <Icon as={FiChevronLeft} />
          </Button>
        )}
      </HStack>

      {collapsed && (
        <Button size="xs" variant="ghost" onClick={onToggleCollapse} mt={2}>
          <Icon as={FiChevronRight} />
        </Button>
      )}

      {/* Navigation */}
      <Box flex={1} overflowY="auto" py={4} px={2}>
        {renderNavSection(
          'Main',
          NAV_ITEMS.filter((i) => i.section === 'main')
        )}
        {renderNavSection(
          'Tools',
          NAV_ITEMS.filter((i) => i.section === 'tools')
        )}
        <Box flex={1} />
        {renderNavSection(
          'System',
          NAV_ITEMS.filter((i) => i.section === 'system')
        )}
      </Box>

      {/* Footer */}
      <Box p={4} borderTop="1px solid" borderColor={borderColor}>
        {!collapsed && (
          <VStack align="stretch" spacing={2}>
            <HStack>
              <Box w="8px" h="8px" borderRadius="full" bg="green.400" boxShadow="0 0 8px #48BB78" />
              <Text fontSize="xs" color="gray.400">
                Connected
              </Text>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="xs" color="gray.500">
                v3.0.0
              </Text>
              <Badge fontSize="10px" colorScheme="blue">
                BETA
              </Badge>
            </HStack>
          </VStack>
        )}
        {collapsed && <Box w="8px" h="8px" borderRadius="full" bg="green.400" mx="auto" />}
      </Box>
    </Box>
  );
};
