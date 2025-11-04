import React, { useState } from "react";
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
