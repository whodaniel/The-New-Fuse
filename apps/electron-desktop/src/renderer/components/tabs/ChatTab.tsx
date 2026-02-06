import {
  Alert,
  AlertIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Divider,
  Flex,
  HStack,
  Icon,
  IconButton,
  Text,
  Textarea,
  useToast,
  VStack,
} from '@chakra-ui/react';
import React, { useEffect, useRef, useState } from 'react';
import { FiDownload, FiSend, FiTrash2 } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';

// Using local interface to match the chatSlice type (timestamp as string for Redux serialization)
interface ChatMessage {
  id: string;
  content: string;
  timestamp: string;
  sender: 'user' | 'system' | 'ai' | 'chrome';
  metadata?: {
    platform?: string;
    confidence?: number;
    tabId?: number;
    url?: string;
  };
}

export const ChatTab: React.FC = () => {
  const toast = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages } = useSelector((state: RootState) => state.chat);
  const { tnfRelay } = useSelector((state: RootState) => state.connections);
  const { mapping } = useSelector((state: RootState) => state.elements);

  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    if (!tnfRelay.connected) {
      toast({
        title: 'Not Connected',
        description: 'Please connect to TNF Relay first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSending(true);
    try {
      if (window.api) {
        const response = await window.api.chatSend(inputMessage.trim());
        if (response.success) {
          setInputMessage('');
          toast({
            title: 'Message Sent',
            description: 'Your message has been processed',
            status: 'success',
            duration: 2000,
            isClosable: true,
          });
        } else {
          toast({
            title: 'Send Failed',
            description: response.error || 'Failed to send message',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
      }
    } catch {
      toast({
        title: 'Send Error',
        description: 'An error occurred while sending the message',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendToChrome = async () => {
    if (!inputMessage.trim()) return;

    if (!mapping?.chatInput || !mapping?.sendButton) {
      toast({
        title: 'Elements Not Detected',
        description: 'Please detect chat elements first in the Elements tab',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSending(true);
    try {
      if (window.api) {
        const response = await window.api.chromeSendMessage({
          type: 'SEND_CHAT_MESSAGE',
          message: inputMessage.trim(),
          mapping: mapping,
        });

        if (response.success) {
          setInputMessage('');
          toast({
            title: 'Message Sent to Browser',
            description: 'Message sent directly to the chat interface',
            status: 'success',
            duration: 2000,
            isClosable: true,
          });
        } else {
          toast({
            title: 'Browser Send Failed',
            description: response.error || 'Failed to send message to browser',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
      }
    } catch {
      toast({
        title: 'Browser Send Error',
        description: 'An error occurred while sending to browser',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      // Clear local history
      // dispatch(clearMessages())
      toast({
        title: 'History Cleared',
        description: 'Chat history has been cleared',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
    } catch {
      toast({
        title: 'Clear Failed',
        description: 'Failed to clear chat history',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleExportHistory = () => {
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        messages: messages,
        totalMessages: messages.length,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'History Exported',
        description: 'Chat history has been exported to file',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch {
      toast({
        title: 'Export Failed',
        description: 'Failed to export chat history',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getSenderColor = (sender: ChatMessage['sender']) => {
    switch (sender) {
      case 'user':
        return 'blue';
      case 'ai':
        return 'green';
      case 'system':
        return 'purple';
      case 'chrome':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getSenderIcon = (sender: ChatMessage['sender']) => {
    switch (sender) {
      case 'user':
        return '👤';
      case 'ai':
        return '🤖';
      case 'system':
        return '⚙️';
      case 'chrome':
        return '🌐';
      default:
        return '❓';
    }
  };

  const renderMessage = (message: ChatMessage) => (
    <Box key={message.id} mb={4}>
      <HStack align="start" spacing={3}>
        <Avatar
          size="sm"
          name={message.sender}
          bg={`${getSenderColor(message.sender)}.500`}
          color="white"
          icon={<Text>{getSenderIcon(message.sender)}</Text>}
        />

        <Box flex={1}>
          <HStack mb={1}>
            <Text fontSize="sm" fontWeight="bold" color={`${getSenderColor(message.sender)}.400`}>
              {message.sender.charAt(0).toUpperCase() + message.sender.slice(1)}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {new Date(message.timestamp).toLocaleTimeString()}
            </Text>
            {message.metadata?.platform && (
              <Badge size="sm" colorScheme="gray" variant="subtle">
                {message.metadata.platform}
              </Badge>
            )}
          </HStack>

          <Box
            bg={message.sender === 'user' ? 'blue.900' : 'whiteAlpha.100'}
            p={3}
            borderRadius="lg"
            borderLeftWidth="3px"
            borderLeftColor={`${getSenderColor(message.sender)}.400`}
          >
            <Text fontSize="sm" whiteSpace="pre-wrap">
              {message.content}
            </Text>
          </Box>

          {message.metadata?.confidence && (
            <Text fontSize="xs" color="gray.500" mt={1}>
              Confidence: {message.metadata.confidence}%
            </Text>
          )}
        </Box>
      </HStack>
    </Box>
  );

  return (
    <VStack spacing={6} align="stretch" h="600px">
      {/* Connection Status */}
      {!tnfRelay.connected && (
        <Alert status="warning" borderRadius="lg">
          <AlertIcon />
          <Box>
            <Text fontSize="sm">
              TNF Relay connection required for chat functionality. Please connect in the
              Connections tab first.
            </Text>
          </Box>
        </Alert>
      )}

      {/* Chat History Controls */}
      <Card bg="whiteAlpha.100" borderColor="whiteAlpha.200">
        <CardBody py={3}>
          <HStack justify="space-between">
            <HStack>
              <Text fontSize="md" fontWeight="bold">
                Chat History
              </Text>
              <Badge colorScheme="blue" variant="subtle">
                {messages.length} messages
              </Badge>
            </HStack>

            <HStack>
              <IconButton
                aria-label="Export history"
                icon={<Icon as={FiDownload} />}
                size="sm"
                variant="ghost"
                onClick={handleExportHistory}
                isDisabled={messages.length === 0}
              />
              <IconButton
                aria-label="Clear history"
                icon={<Icon as={FiTrash2} />}
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={handleClearHistory}
                isDisabled={messages.length === 0}
              />
            </HStack>
          </HStack>
        </CardBody>
      </Card>

      {/* Messages Display */}
      <Card bg="whiteAlpha.50" borderColor="whiteAlpha.200" flex={1}>
        <CardBody>
          <Box
            h="300px"
            overflowY="auto"
            pr={2}
            css={{
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-track': {
                width: '6px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'gray.600',
                borderRadius: '24px',
              },
            }}
          >
            {messages.length === 0 ? (
              <Flex align="center" justify="center" h="100%" direction="column">
                <Text color="gray.500" mb={2}>
                  No messages yet
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Send a message to start the conversation
                </Text>
              </Flex>
            ) : (
              <>
                {messages.map(renderMessage)}
                <div ref={messagesEndRef} />
              </>
            )}
          </Box>
        </CardBody>
      </Card>

      <Divider />

      {/* Message Input */}
      <Card bg="whiteAlpha.100" borderColor="whiteAlpha.200">
        <CardBody>
          <VStack spacing={3}>
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
              rows={3}
              resize="none"
              bg="whiteAlpha.50"
              border="1px solid"
              borderColor="whiteAlpha.300"
              _focus={{
                borderColor: 'blue.400',
                boxShadow: '0 0 0 1px blue.400',
              }}
            />

            <HStack justify="space-between" w="100%">
              <HStack>
                <Text fontSize="xs" color="gray.500">
                  {inputMessage.length} characters
                </Text>
                {mapping?.chatInput && mapping?.sendButton && (
                  <Badge colorScheme="green" variant="subtle" fontSize="xs">
                    Browser elements detected
                  </Badge>
                )}
              </HStack>

              <HStack>
                {mapping?.chatInput && mapping?.sendButton && (
                  <Button
                    onClick={handleSendToChrome}
                    colorScheme="orange"
                    size="sm"
                    leftIcon={<Icon as={FiSend} />}
                    isLoading={isSending}
                    isDisabled={!inputMessage.trim() || !tnfRelay.connected}
                  >
                    Send to Browser
                  </Button>
                )}

                <Button
                  onClick={handleSendMessage}
                  colorScheme="blue"
                  size="sm"
                  leftIcon={<Icon as={FiSend} />}
                  isLoading={isSending}
                  isDisabled={!inputMessage.trim() || !tnfRelay.connected}
                >
                  Send
                </Button>
              </HStack>
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
};
