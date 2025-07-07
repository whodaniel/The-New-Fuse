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

export const LegalPrivacy: React.FC = () => {
  const textColor = useColorModeValue('gray.800', 'white');
  const subTextColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')} py={12}>
      <Container maxW="4xl">
        <VStack spacing={8} align="start">
          <VStack spacing={4} align="start" w="full">
            <Heading size="2xl" color={textColor}>
              Privacy Policy
            </Heading>
            <Text color={subTextColor} fontSize="lg">
              Last updated: December 2024
            </Text>
            <Divider />
          </VStack>

          <VStack spacing={6} align="start" w="full">
            <Box>
              <Heading size="lg" color={textColor} mb={4}>
                1. Information We Collect
              </Heading>
              <Text color={subTextColor} lineHeight="tall" mb={4}>
                We collect information you provide directly to us, such as when you create an account, use our AI collaboration features, or contact us for support.
              </Text>
              <UnorderedList spacing={2} color={subTextColor}>
                <ListItem>Account information (name, email address, password)</ListItem>
                <ListItem>AI agent configurations and workflow data</ListItem>
                <ListItem>Usage analytics and performance metrics</ListItem>
                <ListItem>Communications and support interactions</ListItem>
              </UnorderedList>
            </Box>

            <Box>
              <Heading size="lg" color={textColor} mb={4}>
                2. How We Use Your Information
              </Heading>
              <Text color={subTextColor} lineHeight="tall" mb={4}>
                We use the information we collect to:
              </Text>
              <UnorderedList spacing={2} color={subTextColor}>
                <ListItem>Provide, maintain, and improve our AI orchestration platform</ListItem>
                <ListItem>Process transactions and send related information</ListItem>
                <ListItem>Send technical notices, updates, and support messages</ListItem>
                <ListItem>Respond to your comments, questions, and requests</ListItem>
                <ListItem>Develop new features and functionality</ListItem>
              </UnorderedList>
            </Box>

            <Box>
              <Heading size="lg" color={textColor} mb={4}>
                3. AI Data Processing
              </Heading>
              <Text color={subTextColor} lineHeight="tall">
                Your AI agent data and workflows are processed securely and are never used to train our models or shared with third parties without your explicit consent. 
                We implement enterprise-grade security measures to protect your intellectual property and sensitive information.
              </Text>
            </Box>

            <Box>
              <Heading size="lg" color={textColor} mb={4}>
                4. Data Security
              </Heading>
              <Text color={subTextColor} lineHeight="tall">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, 
                alteration, disclosure, or destruction. This includes encryption, access controls, and regular security audits.
              </Text>
            </Box>

            <Box>
              <Heading size="lg" color={textColor} mb={4}>
                5. Data Retention
              </Heading>
              <Text color={subTextColor} lineHeight="tall">
                We retain your information for as long as your account is active or as needed to provide you services. 
                You may request deletion of your account and associated data at any time.
              </Text>
            </Box>

            <Box>
              <Heading size="lg" color={textColor} mb={4}>
                6. Your Rights
              </Heading>
              <Text color={subTextColor} lineHeight="tall" mb={4}>
                You have the right to:
              </Text>
              <UnorderedList spacing={2} color={subTextColor}>
                <ListItem>Access your personal information</ListItem>
                <ListItem>Correct inaccurate information</ListItem>
                <ListItem>Request deletion of your information</ListItem>
                <ListItem>Object to processing of your information</ListItem>
                <ListItem>Data portability</ListItem>
              </UnorderedList>
            </Box>

            <Box>
              <Heading size="lg" color={textColor} mb={4}>
                7. Contact Us
              </Heading>
              <Text color={subTextColor} lineHeight="tall">
                If you have any questions about this Privacy Policy, please contact us at privacy@thenewfuse.com
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

export default LegalPrivacy;