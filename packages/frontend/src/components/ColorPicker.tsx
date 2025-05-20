import React from 'react';
import {
  Box,
  Input,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  useColorMode,
} from '@chakra-ui/react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const { colorMode } = useColorMode();

  return (
    <Popover>
      <PopoverTrigger>
        <Box
          w="36px"
          h="36px"
          borderRadius="md"
          bg={color}
          cursor="pointer"
          borderWidth="1px"
          borderColor={colorMode === 'dark' ? 'whiteAlpha.300' : 'gray.200'}
          _hover={{
            borderColor: colorMode === 'dark' ? 'whiteAlpha.400' : 'gray.300',
          }}
        />
      </PopoverTrigger>
      <PopoverContent w="200px">
        <PopoverBody>
          <Input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            h="100px"
            p={1}
            borderWidth={0}
          />
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}