import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Alert as ChakraAlert,
  AlertIcon as ChakraAlertIcon,
  Checkbox as ChakraCheckbox,
  Link as ChakraLink,
  useColorModeValue,
  chakra,
} from '@chakra-ui/react';

const Alert = chakra(ChakraAlert);
const AlertIcon = chakra(ChakraAlertIcon);
const Checkbox = chakra(ChakraCheckbox);
const Link = chakra(ChakraLink);

interface LocationState {
  from?: {
    pathname?: string;
  };
}

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const locationState = location.state as LocationState;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const validatedData = loginSchema.parse(formData);
      await login(validatedData.email, validatedData.password);
      const redirectTo = locationState?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to log in');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const bgColor = useColorModeValue('white', 'gray.700');

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.800')} py={{ base: '12', md: '24' }}>
      <Flex align="center" justify="center">
        <Box bg={bgColor} p={8} rounded="lg" w="full" maxW="md" shadow="base">
          <VStack spacing={6}>
            {error && (
              <Alert status="error" rounded="md" width="full">
                <AlertIcon />
                {error}
              </Alert>
            )}

            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
            </FormControl>

            <Flex justify="space-between" width="full">
              <Checkbox
                isChecked={false}
                onChange={() => {}}
              >
                Remember me
              </Checkbox>
              <Link as={RouterLink} to="/forgot-password" color="brand.500">
                Forgot password?
              </Link>
            </Flex>

            <Button
              width="full"
              colorScheme="brand"
              isLoading={isLoading}
              loadingText="Signing in"
              type="submit"
              onClick={handleSubmit}
            >
              Sign in
            </Button>

            <Flex gap={1}>
              Don't have an account?{' '}
              <Link as={RouterLink} to="/register" color="brand.500">
                Sign up
              </Link>
            </Flex>
          </VStack>
        </Box>
      </Flex>
    </Box>
  );
}