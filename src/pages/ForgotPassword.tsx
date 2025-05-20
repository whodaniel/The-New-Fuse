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

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Handle password reset request
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSuccess(true);
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
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
            Forgot Password
          </Heading>
          <Text fontSize="md" textAlign="center" color="gray.600">
            Enter your email and we'll send you a link to reset your password
          </Text>
        </Stack>

        {isSuccess ? (
          <Alert status="success" variant="left-accent">
            <AlertIcon />
            <AlertDescription>
              If an account exists with that email, we've sent password reset instructions.
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
                  <FormLabel htmlFor="email">Email address</FormLabel>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </FormControl>

                <Stack spacing={4} pt={2}>
                  <Button
                    type="submit"
                    colorScheme="brand"
                    size="lg"
                    fontSize="md"
                    isLoading={isSubmitting}
                    loadingText="Sending..."
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