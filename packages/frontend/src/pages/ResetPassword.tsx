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
  useColorModeValue,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';

export function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
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
      setStatus('error');
      return;
    }

    setIsSubmitting(true);
    setStatus('idle');
    setError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      if (response.ok) {
        setStatus('success');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box minH="100vh" bg={bgColor} py={12}>
      <Container maxW="lg">
        <Box bg={boxBgColor} p={8} rounded="lg" boxShadow="lg">
          <Stack spacing={8}>
            <Stack align="center">
              <Heading fontSize="2xl">Reset Password</Heading>
              <Text fontSize="md" color="gray.600">
                Enter your new password
              </Text>
            </Stack>

            {status === 'success' ? (
              <Alert status="success" rounded="md">
                <AlertIcon />
                Password reset successful. Redirecting to login...
              </Alert>
            ) : (
              <form onSubmit={handleSubmit}>
                <Stack spacing={4}>
                  {status === 'error' && (
                    <Alert status="error" rounded="md">
                      <AlertIcon />
                      {error}
                    </Alert>
                  )}

                  <FormControl id="password">
                    <FormLabel>New Password</FormLabel>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </FormControl>

                  <FormControl id="confirm-password">
                    <FormLabel>Confirm Password</FormLabel>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </FormControl>

                  <Stack spacing={4}>
                    <Button
                      type="submit"
                      colorScheme="brand"
                      isLoading={isSubmitting}
                      loadingText="Resetting..."
                    >
                      Reset Password
                    </Button>

                    <Button
                      as={RouterLink}
                      to="/login"
                      variant="link"
                      color="brand.500"
                    >
                      Back to Login
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