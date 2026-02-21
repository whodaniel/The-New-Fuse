import { Center, Spinner, useColorModeValue } from '@chakra-ui/react';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
}

export function LoadingSpinner({ fullScreen = true }: LoadingSpinnerProps) {
  const spinnerColor = useColorModeValue('brand.500', 'brand.200');
  
  return (
    <Center h={fullScreen ? "100vh" : "100%"}>
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color={spinnerColor}
        size="xl"
      />
    </Center>
  );
}