// @ts-nocheck
import {
  Badge,
  Box,
  Flex,
  Heading,
  Icon,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react';
import { Activity, Bot, MessageSquare, Zap } from 'lucide-react';
import React, { useState } from 'react';

// Lazy load the sub-pages to keep the bundle lean
import AIAgentPortal from './AIAgentDashboard';
import AICommandCenter from './AICommandCenter';
import TNFCommandCenter from './TNFCommandCenter';

const CommandCore: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const bgGradient = 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)';
  const activeTabColor = 'cyan.400';

  return (
    <Box minH="100vh" bg="gray.900" color="white" position="relative" overflow="hidden">
      {/* Universal Background Deco */}
      <Box
        position="absolute"
        top="-10%"
        left="-5%"
        w="40%"
        h="40%"
        bg="cyan.500"
        opacity="0.05"
        filter="blur(120px)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="-10%"
        right="-5%"
        w="40%"
        h="40%"
        bg="purple.500"
        opacity="0.05"
        filter="blur(120px)"
        pointerEvents="none"
      />

      <Box p={4} position="relative" zIndex={1}>
        {/* Header Section */}
        <Flex
          justify="space-between"
          align="flex-end"
          mb={6}
          borderBottom="1px solid"
          borderColor="whiteAlpha.100"
          pb={4}
        >
          <Box>
            <Flex align="center" gap={3}>
              <Icon as={Zap} color="cyan.400" boxSize={6} />
              <Heading size="lg" bgGradient="linear(to-r, cyan.400, purple.400)" bgClip="text">
                Command Core
              </Heading>
              <Badge colorScheme="cyan" variant="outline" fontSize="xs">
                v2.0.0-ASCENSION
              </Badge>
            </Flex>
            <Text color="gray.400" mt={1} fontSize="sm">
              Unified Authority Plane for TNF Orchestration, Fleet Management, and AI Streams
            </Text>
          </Box>

          <Flex
            gap={4}
            textTransform="uppercase"
            fontSize="xs"
            fontWeight="bold"
            letterSpacing="widest"
            color="gray.500"
          >
            <Flex align="center" gap={1}>
              <Box w={2} h={2} borderRadius="full" bg="green.400" />
              Relay Live
            </Flex>
            <Flex align="center" gap={1}>
              <Box w={2} h={2} borderRadius="full" bg="green.400" />
              Mesh Active
            </Flex>
          </Flex>
        </Flex>

        {/* Unified Tab Navigation */}
        <Tabs variant="unstyled" index={activeTab} onChange={(index) => setActiveTab(index)} isLazy>
          <TabList
            bg="whiteAlpha.50"
            p={1}
            borderRadius="lg"
            display="inline-flex"
            mb={6}
            border="1px solid"
            borderColor="whiteAlpha.100"
          >
            <Tab
              _selected={{ bg: 'whiteAlpha.200', color: 'cyan.400', shadow: 'sm' }}
              borderRadius="md"
              px={6}
              py={2}
              fontSize="sm"
              fontWeight="semibold"
              display="flex"
              gap={2}
              alignItems="center"
            >
              <Activity size={16} /> Mesh
            </Tab>
            <Tab
              _selected={{ bg: 'whiteAlpha.200', color: 'purple.400', shadow: 'sm' }}
              borderRadius="md"
              px={6}
              py={2}
              fontSize="sm"
              fontWeight="semibold"
              display="flex"
              gap={2}
              alignItems="center"
            >
              <Bot size={16} /> Fleet
            </Tab>
            <Tab
              _selected={{ bg: 'whiteAlpha.200', color: 'pink.400', shadow: 'sm' }}
              borderRadius="md"
              px={6}
              py={2}
              fontSize="sm"
              fontWeight="semibold"
              display="flex"
              gap={2}
              alignItems="center"
            >
              <MessageSquare size={16} /> Streams
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel p={0}>
              <TNFCommandCenter />
            </TabPanel>
            <TabPanel p={0}>
              <AIAgentPortal />
            </TabPanel>
            <TabPanel p={0}>
              <AICommandCenter />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
};

export default CommandCore;
