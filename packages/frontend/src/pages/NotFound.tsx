import React from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  useColorModeValue,
  Icon
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FaHome, FaExclamationTriangle } from 'react-icons/fa';

export const NotFound: React.FC = () => {
  const textColor = useColorModeValue('gray.800', 'white');
  const subTextColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <Box
      minH="100vh"
      bg={useColorModeValue('gray.50', 'gray.900')}
      display="flex"
      alignItems="center"
    >
      <Container maxW="md" textAlign="center">
        <VStack spacing={8}>
          <Icon 
            as={FaExclamationTriangle} 
            boxSize={16} 
            color="orange.500"
          />
          
          <VStack spacing={4}>
            <Heading 
              size="2xl" 
              color={textColor}
              fontWeight="bold"
            >
              404
            </Heading>
            
            <Heading 
              size="lg" 
              color={textColor}
            >
              Page Not Found
            </Heading>
            
            <Text 
              color={subTextColor} 
              fontSize="lg"
              maxW="sm"
            >
              Sorry, we couldn't find the page you're looking for. 
              The page might have been moved or deleted.
            </Text>
          </VStack>

          <VStack spacing={4}>
            <RouterLink to="/">
              <Button 
                colorScheme="blue" 
                size="lg"
                leftIcon={<FaHome />}
              >
                Back to Home
              </Button>
            </RouterLink>
            
            <RouterLink to="/dashboard">
              <Button 
                variant="outline" 
                size="lg"
              >
                Go to Dashboard
              </Button>
            </RouterLink>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default NotFound;