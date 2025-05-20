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
import { Link as RouterLink, useSearchParams } from 'react-router-dom';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const boxBgColor = useColorModeValue('white', 'gray.700');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

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
                Reset Password
              </Text>
              <Text fontSize="md" color="gray.600">
                Enter your new password
              </Text>
            </Stack>

            {!token ? (
              <Alert status="error" rounded="md">
                <AlertIcon />
                Invalid or expired reset token. Please request a new password reset.
              </Alert>
            ) : status === 'success' ? (
              <>
                <Alert status="success" rounded="md">
                  <AlertIcon />
                  Your password has been successfully reset.
                </Alert>
                <Button
                  as={RouterLink}
                  to="/login"
                  colorScheme="brand"
                >
                  Return to Login
                </Button>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <Stack gap={4}>
                  {status === 'error' && (
                    <Alert status="error" rounded="md">
                      <AlertIcon />
                      {error}
                    </Alert>
                  )}

                  <FormControl>
                    <FormLabel>New Password</FormLabel>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Confirm New Password</FormLabel>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </FormControl>

                  <Stack gap={4}>
                    <Button
                      type="submit"
                      colorScheme="brand"
                      isLoading={isSubmitting}
                      loadingText="Resetting..."
                    >
                      Reset Password
                    </Button>
                  </Stack>
                </Stack>
              </form>
            )}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}