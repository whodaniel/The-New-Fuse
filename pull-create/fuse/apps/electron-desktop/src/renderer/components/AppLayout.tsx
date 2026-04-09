import { Box, Flex, useColorModeValue } from '@chakra-ui/react';
import React, { useState } from 'react';
import { ConsoleView } from './ConsoleView';
import { QuickActionsDashboard } from './QuickActionsDashboard';
import { Sidebar } from './Sidebar';
import CredentialsTab from './tabs/CredentialsTab';

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');

  const bg = useColorModeValue('gray.50', 'gray.900');

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <QuickActionsDashboard />;
      case 'console':
        return <ConsoleView initialTab="logs" />;
      case 'agents':
      case 'chat':
        // For now, map Chat/Agents to ConsoleView (it has tabs for these)
        // Or eventually split them out
        return <ConsoleView initialTab="chat" />;
      case 'settings':
        return <CredentialsTab />;
      default:
        return <QuickActionsDashboard />;
    }
  };

  return (
    <Flex h="100vh" overflow="hidden" bg={bg}>
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
      <Box flex={1} h="100%" overflow="hidden" position="relative">
        {renderContent()}
      </Box>
    </Flex>
  );
};
