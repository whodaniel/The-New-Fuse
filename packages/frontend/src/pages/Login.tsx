import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Alert as ChakraAlert,
  AlertIcon,
  Text,
  useColorModeValue,
  Link,
  Checkbox as ChakraCheckbox,
} from '@chakra-ui/react';
import { Navigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export function Login() {
  const { isAuthenticated, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const boxBgColor = useColorModeValue('white', 'gray.700');

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const success = await login({ email, password, rememberMe });
      if (!success) {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred during login');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg={bgColor} py={12}>
      <Container maxW="lg">
        <Box bg={boxBgColor} p={8} rounded="lg" boxShadow="lg">
          <Stack gap={8}>
            <Stack align="center">
              <Text fontSize="2xl" fontWeight="bold">Sign in to your account</Text>
            </Stack>

            <form onSubmit={handleSubmit}>
              <Stack gap={8}>
                {error && (
                  <ChakraAlert status="error" rounded="md">
                    <AlertIcon />
                    {error}
                  </ChakraAlert>
                )}

                <Stack gap={4}>
                  <FormControl>
                    <FormLabel>Email address</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Password</FormLabel>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </FormControl>
                </Stack>

                <Stack gap={10}>
                  <Stack direction="row" justify="space-between">
                    <ChakraCheckbox
                      isChecked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    >
                      Remember me
                    </ChakraCheckbox>
                    <Link as={RouterLink} to="/forgot-password" color="brand.500">
                      Forgot password?
                    </Link>
                  </Stack>

                  <Button
                    type="submit"
                    colorScheme="brand"
                    isLoading={isLoading}
                    loadingText="Signing in..."
                  >
                    Sign in
                  </Button>
                </Stack>
              </Stack>
            </form>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}