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
  useColorModeValue,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const boxBgColor = useColorModeValue('white', 'gray.700');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('idle');
    setError('');

    try {
      // Implement password reset logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="lg" py={12}>
        <Box bg={boxBgColor} p={8} rounded="lg" boxShadow="lg">
          <Stack gap={8}>
            <Stack align="center">
              <Text fontSize="2xl" fontWeight="bold">
                Forgot Password
              </Text>
              <Text fontSize="md" color="gray.600">
                Enter your email address and we'll send you a link to reset your password
              </Text>
            </Stack>

            <form onSubmit={handleSubmit}>
              <Stack gap={4}>
                {status === 'error' && (
                  <Alert status="error" rounded="md">
                    <AlertIcon />
                    {error}
                  </Alert>
                )}

                {status === 'success' ? (
                  <Alert status="success" rounded="md">
                    <AlertIcon />
                    Check your email for password reset instructions.
                  </Alert>
                ) : (
                  <>
                    <FormControl>
                      <FormLabel>Email address</FormLabel>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </FormControl>

                    <Stack gap={4}>
                      <Button
                        type="submit"
                        colorScheme="brand"
                        isLoading={isSubmitting}
                        loadingText="Sending..."
                      >
                        Reset Password
                      </Button>

                      <Button
                        as={RouterLink}
                        to="/login"
                        variant="ghost"
                      >
                        Back to Login
                      </Button>
                    </Stack>
                  </>
                )}
              </Stack>
            </form>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}