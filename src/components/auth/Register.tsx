import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  useColorModeValue,
  Heading,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  Spinner, // For loading state
  InputGroup, // For password visibility toggle
  InputRightElement, // For password visibility toggle
  Icon, // For password visibility toggle icon
  Checkbox, // For terms and conditions
  Link as ChakraLink, // For linking to terms/privacy
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'; // Icons for password visibility
import { useAuth } from '../../contexts/AuthContext'; // Adjust path as necessary
import { useNavigate } from 'react-router-dom'; // To redirect after successful registration

export function RegisterForm() {
  const [username, setUsername] = useState(''); // Optional: if you collect username
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth(); // Assuming this function exists in AuthContext
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreedToTerms) {
      setError('You must agree to the terms and conditions.');
      return;
    }
    // Add more validation as needed (e.g., password strength)

    setIsLoading(true);
    try {
      // The register function should handle API calls
      // It might take an object with email, password, and optionally username
      await register({ email, password, username }); // Adjust payload as needed
      // On successful registration, navigate to a confirmation page or login
      navigate('/dashboard'); // Or '/login' or a "please verify your email" page
    } catch (err: any) {
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const cardBg = useColorModeValue('white', 'gray.700');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box
      bg={cardBg}
      p={{ base: 6, sm: 8 }}
      shadow="base"
      borderRadius="lg"
      borderWidth="1px"
      borderColor={cardBorderColor}
    >
      <Stack spacing="6" as="form" onSubmit={handleSubmit}>
        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription display="block">{error}</AlertDescription>
            </Box>
            <CloseButton position="absolute" right="8px" top="8px" onClick={() => setError(null)} />
          </Alert>
        )}
        {/* Optional: Username field */}
        {/* <FormControl id="username-register">
          <FormLabel>Username (Optional)</FormLabel>
          <Input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="yourusername"
            autoComplete="username"
          />
        </FormControl> */}
        <FormControl id="email-register" isRequired>
          <FormLabel>Email address</FormLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </FormControl>
        <FormControl id="password-register" isRequired>
          <FormLabel>Password</FormLabel>
          <InputGroup>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <InputRightElement>
              <IconButton
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                onClick={() => setShowPassword(!showPassword)}
                variant="ghost"
              />
            </InputRightElement>
          </InputGroup>
        </FormControl>
        <FormControl id="confirm-password-register" isRequired>
          <FormLabel>Confirm Password</FormLabel>
          <InputGroup>
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <InputRightElement>
              <IconButton
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                variant="ghost"
              />
            </InputRightElement>
          </InputGroup>
        </FormControl>
        <FormControl id="terms-agreement" isRequired>
          <Checkbox
            isChecked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            colorScheme="brand"
          >
            <Text fontSize="sm">
              I agree to the{' '}
              <ChakraLink href="/terms" color="brand.500" isExternal>
                Terms and Conditions
              </ChakraLink>{' '}
              and{' '}
              <ChakraLink href="/privacy" color="brand.500" isExternal>
                Privacy Policy
              </ChakraLink>
              .
            </Text>
          </Checkbox>
        </FormControl>
        <Button
          type="submit"
          colorScheme="brand"
          size="lg"
          fontSize="md"
          isLoading={isLoading}
          spinner={<Spinner size="sm" />}
          w="full" // Make button full width
        >
          Create Account
        </Button>
      </Stack>
    </Box>
  );
}

export default RegisterForm;

// Need to import IconButton for password visibility toggle
import { IconButton } from '@chakra-ui/react';