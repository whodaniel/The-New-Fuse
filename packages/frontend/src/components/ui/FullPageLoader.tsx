import React from 'react';
import { Box, Spinner, Text, VStack, useColorModeValue } from '@chakra-ui/react';

const FullPageLoader: React.FC = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bg={bgColor}
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      zIndex="overlay"
    >
      <VStack spacing={4}>
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="brand.500"
          size="xl"
        />
        <Text fontSize="lg" fontWeight="medium" color={textColor}>
          Loading...
        </Text>
      </VStack>
    </Box>
  );
};

export default FullPageLoader;