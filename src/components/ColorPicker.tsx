import { Box, SimpleGrid, Button, useColorModeValue } from '@chakra-ui/react';
import { useTheme } from '../contexts/ThemeContext.js';

export function ColorPicker() {
  const { updateTheme } = useTheme();
  const buttonBg = useColorModeValue('white', 'gray.700');

  const colors = [
    { name: 'blue', value: '#3182CE' },
    { name: 'teal', value: '#319795' },
    { name: 'green', value: '#38A169' },
    { name: 'purple', value: '#805AD5' },
    { name: 'pink', value: '#D53F8C' },
    { name: 'red', value: '#E53E3E' },
    { name: 'orange', value: '#DD6B20' },
    { name: 'yellow', value: '#D69E2E' },
  ];

  return (
    <SimpleGrid columns={4} spacing={4}>
      {colors.map((color) => (
        <Button
          key={color.name}
          h="12"
          w="12"
          p="0"
          bg={buttonBg}
          aria-label={`Select ${color.name} theme color`}
          onClick={() => updateTheme({ primaryColor: color.value })}
          _hover={{ transform: 'scale(1.1)' }}
          transition="transform 0.2s"
        >
          <Box
            w="8"
            h="8"
            rounded="full"
            bg={color.value}
          />
        </Button>
      ))}
    </SimpleGrid>
  );
}