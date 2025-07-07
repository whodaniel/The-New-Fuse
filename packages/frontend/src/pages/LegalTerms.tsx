import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  useColorModeValue,
  Divider,
  UnorderedList,
  ListItem
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

export const LegalTerms: React.FC = () => {
  const textColor = useColorModeValue('gray.800', 'white');
  const subTextColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')} py={12}>
      <Container maxW="4xl">
        <VStack spacing={8} align="start">
          <VStack spacing={4} align="start" w="full">
            <Heading size="2xl" color={textColor}>
              Terms of Service
            </Heading>
            <Text color={subTextColor} fontSize="lg">
              Last updated: December 2024
            </Text>
            <Divider />
          </VStack>

          <VStack spacing={6} align="start" w="full">
            <Box>
              <Heading size="lg" color={textColor} mb={4}>
                1. Acceptance of Terms
              </Heading>
              <Text color={subTextColor} lineHeight="tall">
                By accessing and using The New Fuse platform, you accept and agree to be bound by the terms and provision of this agreement.
              </Text>
            </Box>

            <Box>
              <Heading size="lg" color={textColor} mb={4}>
                2. Use License
              </Heading>
              <Text color={subTextColor} lineHeight="tall" mb={4}>
                Permission is granted to temporarily access The New Fuse platform for personal and commercial use. This is the grant of a license, not a transfer of title, and under this license you may not:
              </Text>
              <UnorderedList spacing={2} color={subTextColor}>
                <ListItem>modify or copy the materials</ListItem>
                <ListItem>use the materials for any commercial purpose or for any public display</ListItem>
                <ListItem>attempt to reverse engineer any software contained on the platform</ListItem>
                <ListItem>remove any copyright or other proprietary notations from the materials</ListItem>
              </UnorderedList>
            </Box>

            <Box>
              <Heading size="lg" color={textColor} mb={4}>
                3. AI Agent Usage
              </Heading>
              <Text color={subTextColor} lineHeight="tall">
                Users are responsible for the actions and outputs of AI agents created or managed through The New Fuse platform. 
                All AI interactions must comply with applicable laws and regulations.
              </Text>
            </Box>

            <Box>
              <Heading size="lg" color={textColor} mb={4}>
                4. Data Privacy and Security
              </Heading>
              <Text color={subTextColor} lineHeight="tall">
                We are committed to protecting your privacy and data security. All data processing activities are governed by our Privacy Policy. 
                Users maintain ownership of their data and can request deletion at any time.
              </Text>
            </Box>

            <Box>
              <Heading size="lg" color={textColor} mb={4}>
                5. Limitations
              </Heading>
              <Text color={subTextColor} lineHeight="tall">
                In no event shall The New Fuse or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) 
                arising out of the use or inability to use the platform.
              </Text>
            </Box>

            <Box>
              <Heading size="lg" color={textColor} mb={4}>
                6. Contact Information
              </Heading>
              <Text color={subTextColor} lineHeight="tall">
                If you have any questions about these Terms of Service, please contact us at legal@thenewfuse.com
              </Text>
            </Box>
          </VStack>

          <Divider />
          
          <Text color={subTextColor} fontSize="sm">
            <RouterLink to="/" style={{ textDecoration: 'underline' }}>
              ← Back to Home
            </RouterLink>
          </Text>
        </VStack>
      </Container>
    </Box>
  );
};

export default LegalTerms;