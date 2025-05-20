import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Avatar,
  Flex,
  Divider,
  Spinner,
  useColorModeValue
} from '@chakra-ui/react';
import { useWizard } from './WizardProvider.js';
import { ragService } from '../../../../packages/core/src/services/rag-service';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface GreeterAgentProps {
  initialMessage?: string;
  agentName?: string;
  agentAvatar?: string;
}

export const GreeterAgent: React.FC<GreeterAgentProps> = ({
  initialMessage = "Hello! I'm your AI assistant for The New Fuse platform. I can help you get started and answer any questions you might have. What would you like to know?",
  agentName = "Fuse Assistant",
  agentAvatar = "/assets/images/assistant-avatar.png"
}) => {
  const { addConversation } = useWizard();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const userBgColor = useColorModeValue('blue.50', 'blue.900');
  const assistantBgColor = useColorModeValue('gray.100', 'gray.600');

  // Initialize with system message and initial greeting
  useEffect(() => {
    const systemMessage: Message = {
      id: 'system-1',
      role: 'system',
      content: `You are the Greeter Agent for The New Fuse platform. Your name is ${agentName}.
      You help users get started with the platform by answering their questions and providing guidance.
      The New Fuse is an AI agent coordination platform that enables intelligent interaction between different AI systems.
      Be friendly, helpful, and concise in your responses.`,
      timestamp: new Date()
    };

    const initialGreeting: Message = {
      id: 'assistant-1',
      role: 'assistant',
      content: initialMessage,
      timestamp: new Date()
    };

    setMessages([systemMessage, initialGreeting]);

    // Add to conversation history in wizard state
    addConversation({
      role: 'system',
      content: systemMessage.content
    });

    addConversation({
      role: 'assistant',
      content: initialGreeting.content
    });
  }, [addConversation, agentName, initialMessage]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Function to generate a response using RAG
  const generateResponse = async (userMessage: string): Promise<string> => {
    setIsTyping(true);

    try {
      // Call the local RagService to generate a response
      const response = await ragService.query(userMessage);
      return response;
    } catch (error) {
      console.error('Error generating response from RagService:', error);
      return "I encountered an issue trying to find an answer for you. Please try asking in a different way or check the documentation.";
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Create user message
    const userMessage: Message = {
      id: `user-${messages.length}`,
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    // Add user message to state and conversation history
    setMessages(prev => [...prev, userMessage]);
    addConversation({
      role: 'user',
      content: input
    });

    // Clear input
    setInput('');

    // Generate response
    const responseContent = await generateResponse(input);

    // Create assistant message
    const assistantMessage: Message = {
      id: `assistant-${messages.length + 1}`,
      role: 'assistant',
      content: responseContent,
      timestamp: new Date()
    };

    // Add assistant message to state and conversation history
    setMessages(prev => [...prev, assistantMessage]);
    addConversation({
      role: 'assistant',
      content: responseContent
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box
      borderRadius="lg"
      overflow="hidden"
      bg={bgColor}
      boxShadow="md"
      height="500px"
      display="flex"
      flexDirection="column"
    >
      {/* Chat header */}
      <Box p={4} bg="blue.600" color="white">
        <HStack>
          <Avatar size="sm" name={agentName} src={agentAvatar} />
          <Text fontWeight="bold">{agentName}</Text>
        </HStack>
      </Box>

      {/* Messages container */}
      <VStack
        flex="1"
        overflowY="auto"
        p={4}
        alignItems="stretch"
        spacing={4}
      >
        {messages.filter(m => m.role !== 'system').map((message) => (
          <Flex
            key={message.id}
            justifyContent={message.role === 'user' ? 'flex-end' : 'flex-start'}
          >
            <Box
              maxW="80%"
              bg={message.role === 'user' ? userBgColor : assistantBgColor}
              p={3}
              borderRadius="lg"
            >
              {message.role === 'assistant' && (
                <HStack mb={1}>
                  <Avatar size="xs" name={agentName} src={agentAvatar} />
                  <Text fontWeight="bold" fontSize="sm">{agentName}</Text>
                </HStack>
              )}
              <Text>{message.content}</Text>
              <Text fontSize="xs" color="gray.500" textAlign="right" mt={1}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </Box>
          </Flex>
        ))}

        {isTyping && (
          <Flex justifyContent="flex-start">
            <Box bg={assistantBgColor} p={3} borderRadius="lg">
              <HStack>
                <Avatar size="xs" name={agentName} src={agentAvatar} />
                <Spinner size="sm" />
              </HStack>
            </Box>
          </Flex>
        )}

        <div ref={messagesEndRef} />
      </VStack>

      <Divider />

      {/* Input area */}
      <Box p={4}>
        <HStack>
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isTyping}
          />
          <Button
            colorScheme="blue"
            onClick={handleSendMessage}
            isLoading={isTyping}
            loadingText="Sending"
            disabled={!input.trim() || isTyping}
          >
            Send
          </Button>
        </HStack>
      </Box>
    </Box>
  );
};
