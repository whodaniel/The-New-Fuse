import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Alert,
  AlertIcon,
  Text,
  Link,
  Checkbox,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

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

  const handleSubmit = async (e: React.FormEvent) => {
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
                  <Alert status="error" rounded="md">
                    <AlertIcon />
                    {error}
                  </Alert>
                )}

                <Stack gap={4}>
                  <FormControl>
                    <FormLabel>Email address</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Password</FormLabel>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </FormControl>
                </Stack>

                <Stack gap={10}>
                  <Stack direction="row" justify="space-between" align="center">
                    <Checkbox
                      isChecked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    >
                      Remember me
                    </Checkbox>
                    <Link
                      as={RouterLink}
                      to="/forgot-password"
                      color="brand.500"
                    >
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
