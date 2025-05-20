import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by error boundary:', error, errorInfo);
  }

  // Fallback UI cannot use hooks directly if this is a class component.
  // Option 1: Convert ErrorBoundary to Functional Component (recommended if new code)
  // Option 2: Create a small functional component for the fallback UI
  // Option 3: Pass theme values as props if ErrorBoundary must remain a class.

  // Example for Option 2:
  FallbackUI = ({ error, onTryAgain }: { error?: Error, onTryAgain: () => void }) => {
    const bgColor = useColorModeValue('gray.50', 'gray.800');
    const textColor = useColorModeValue('gray.600', 'gray.400');

    return (
      <Box minH="100vh" bg={bgColor}>
        <Container maxW="container.md" py={20}>
          <VStack spacing={8} align="center">
            <Heading>Something went wrong</Heading>
            <Text color={textColor}>
              {error?.message || 'An unexpected error occurred'}
            </Text>
            <Button
              colorScheme="brand"
              onClick={onTryAgain}
            >
              Try again
            </Button>
          </VStack>
        </Container>
      </Box>
    );
  }

  render() {
    if (this.state.hasError) {
      // Use the FallbackUI functional component
      return <this.FallbackUI error={this.state.error} onTryAgain={() => this.setState({ hasError: false, error: undefined })} />;
    }

    return this.props.children;
  }
}