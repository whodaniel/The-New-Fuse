import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Heading,
  Text,
  useColorModeValue,
  Alert,
  AlertIcon,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // const { signup, isLoading } = useAuth(); // Assuming a signup method in useAuth
  const { register, isLoading } = useAuthContext();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!name || !email || !password) {
        setError('All fields are required.');
        return;
    }

    try {
      const success = await register({ 
        email, 
        password, 
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ').slice(1).join(' ') || 'User'
      });
      
      if (success) {
        setSuccess('Registration successful! You are now logged in.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
      console.error(err);
    }
  };

  return (
    <Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6}>
      <Stack align={'center'}>
        <Heading fontSize={'4xl'}>Create your account</Heading>
        <Text fontSize={'lg'} color={'gray.600'}>
          to start your journey with us 🚀
        </Text>
      </Stack>
      <Box
        rounded={'lg'}
        bg={useColorModeValue('white', 'gray.700')}
        boxShadow={'lg'}
        p={8}>
        <Stack spacing={4} as="form" onSubmit={handleSubmit}>
          {error && (
            <Alert status="error" rounded="md">
              <AlertIcon />
              {error}
            </Alert>
          )}
          {success && (
            <Alert status="success" rounded="md">
              <AlertIcon />
              {success}
            </Alert>
          )}
          <FormControl id="name-register" isRequired>
            <FormLabel>Full Name</FormLabel>
            <Input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)} 
              placeholder="John Doe"
              isDisabled={isLoading || !!success}
            />
          </FormControl>
          <FormControl id="email-register" isRequired>
            <FormLabel>Email address</FormLabel>
            <Input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="your.email@example.com"
              isDisabled={isLoading || !!success}
            />
          </FormControl>
          <FormControl id="password-register" isRequired>
            <FormLabel>Password</FormLabel>
            <Input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              isDisabled={isLoading || !!success}
            />
          </FormControl>
          <FormControl id="confirm-password-register" isRequired>
            <FormLabel>Confirm Password</FormLabel>
            <Input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              isDisabled={isLoading || !!success}
            />
          </FormControl>
          <Stack spacing={10} pt={2}>
            <Button
              bg={'brand.400'}
              color={'white'}
              _hover={{
                bg: 'brand.500',
              }}
              type="submit"
              isLoading={isLoading}
              loadingText="Registering..."
              isDisabled={isLoading || !!success}
              >
              Register
            </Button>
          </Stack>
          <Stack pt={6}>
              <Text align={'center'}>
                Already have an account? <ChakraLink as={RouterLink} to="/login" color={'brand.400'}>Login</ChakraLink>
              </Text>
            </Stack>
        </Stack>
      </Box>
    </Stack>
  );
};