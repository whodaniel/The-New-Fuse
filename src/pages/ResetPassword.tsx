import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Heading,
  Text,
  Alert,
  AlertIcon,
  AlertDescription,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Handle password reset
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSuccess(true);
    } catch (err) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const bgColor = useColorModeValue('white', 'gray.700');

  return (
    <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
      <VStack gap={8}>
        <Stack spacing={6} w="full" maxW="md" mx="auto">
          <Heading size="xl" textAlign="center">
            Reset Password
          </Heading>
          <Text fontSize="md" textAlign="center" color="gray.600">
            Enter your new password below
          </Text>
        </Stack>

        {isSuccess ? (
          <Alert status="success" variant="left-accent">
            <AlertIcon />
            <AlertDescription>
              Your password has been reset successfully. You can now login with your new password.
            </AlertDescription>
          </Alert>
        ) : (
          <Box
            py={{ base: '0', sm: '8' }}
            px={{ base: '4', sm: '10' }}
            bg={bgColor}
            boxShadow={{ base: 'none', sm: 'md' }}
            borderRadius={{ base: 'none', sm: 'xl' }}
            w="full"
            maxW="md"
            mx="auto"
          >
            <form onSubmit={handleSubmit}>
              <Stack spacing={4}>
                {error && (
                  <Alert status="error" variant="left-accent">
                    <AlertIcon />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <FormControl isRequired>
                  <FormLabel htmlFor="password">New Password</FormLabel>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel htmlFor="confirmPassword">Confirm Password</FormLabel>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </FormControl>

                <Stack spacing={4} pt={2}>
                  <Button
                    type="submit"
                    colorScheme="brand"
                    size="lg"
                    fontSize="md"
                    isLoading={isSubmitting}
                    loadingText="Resetting..."
                  >
                    Reset Password
                  </Button>

                  <Button
                    as={Link}
                    to="/login"
                    variant="ghost"
                    size="lg"
                    fontSize="md"
                  >
                    Back to Login
                  </Button>
                </Stack>
              </Stack>
            </form>
          </Box>
        )}
      </VStack>
    </Container>
  );
}