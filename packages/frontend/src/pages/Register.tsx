import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  VStack,
  HStack,
  Link,
  useColorModeValue,
  InputGroup,
  InputRightElement,
  IconButton,
  Alert,
  AlertIcon,
  Checkbox,
  Divider,
  useToast
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { FaGoogle, FaGithub } from 'react-icons/fa';

export const Register: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const toast = useToast();
  const { register: registerUser, isLoading: authLoading } = useAuthContext();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: 'Account created successfully!',
        description: 'Welcome to The New Fuse',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      navigate('/dashboard');
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')} py={12}>
      <Container maxW="md">
        <VStack spacing={8}>
          {/* Header */}
          <VStack spacing={2} textAlign="center">
            <Heading size="xl" color={useColorModeValue('gray.900', 'white')}>
              Create Your Account
            </Heading>
            <Text color={useColorModeValue('gray.600', 'gray.400')}>
              Join The New Fuse and start orchestrating AI workflows
            </Text>
          </VStack>

          {/* Registration Form */}
          <Box
            bg={bgColor}
            p={8}
            rounded="xl"
            shadow="lg"
            border="1px"
            borderColor={borderColor}
            w="full"
          >
            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
                {error && (
                  <Alert status="error" rounded="md">
                    <AlertIcon />
                    {error}
                  </Alert>
                )}

                {/* Social Registration */}
                <VStack spacing={3} w="full">
                  <Button
                    w="full"
                    variant="outline"
                    leftIcon={<FaGoogle />}
                    isDisabled
                  >
                    Continue with Google
                  </Button>
                  <Button
                    w="full"
                    variant="outline"
                    leftIcon={<FaGithub />}
                    isDisabled
                  >
                    Continue with GitHub
                  </Button>
                </VStack>

                <HStack w="full">
                  <Divider />
                  <Text fontSize="sm" color="gray.500" whiteSpace="nowrap">
                    or continue with email
                  </Text>
                  <Divider />
                </HStack>

                {/* Name Fields */}
                <HStack spacing={4} w="full">
                  <FormControl isRequired>
                    <FormLabel>First Name</FormLabel>
                    <Input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="John"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Last Name</FormLabel>
                    <Input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Doe"
                    />
                  </FormControl>
                </HStack>

                {/* Email */}
                <FormControl isRequired>
                  <FormLabel>Email Address</FormLabel>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@company.com"
                  />
                </FormControl>

                {/* Password */}
                <FormControl isRequired>
                  <FormLabel>Password</FormLabel>
                  <InputGroup>
                    <Input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                        onClick={() => setShowPassword(!showPassword)}
                        variant="ghost"
                        size="sm"
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                {/* Confirm Password */}
                <FormControl isRequired>
                  <FormLabel>Confirm Password</FormLabel>
                  <Input
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                  />
                </FormControl>

                {/* Terms Checkbox */}
                <FormControl>
                  <Checkbox
                    name="agreeToTerms"
                    isChecked={formData.agreeToTerms}
                    onChange={handleChange}
                  >
                    <Text fontSize="sm">
                      I agree to the{' '}
                      <Link as={RouterLink} to="/legal/terms" color="blue.500">
                        Terms of Service
                      </Link>
                      {' '}and{' '}
                      <Link as={RouterLink} to="/legal/privacy" color="blue.500">
                        Privacy Policy
                      </Link>
                    </Text>
                  </Checkbox>
                </FormControl>

                {/* Submit Button */}
                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  w="full"
                  isLoading={isLoading}
                  loadingText="Creating Account..."
                >
                  Create Account
                </Button>
              </VStack>
            </form>
          </Box>

          {/* Login Link */}
          <HStack>
            <Text color={useColorModeValue('gray.600', 'gray.400')}>
              Already have an account?
            </Text>
            <Link as={RouterLink} to="/login" color="blue.500" fontWeight="medium">
              Sign in
            </Link>
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default Register;