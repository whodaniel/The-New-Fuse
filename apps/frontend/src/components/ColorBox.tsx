import React from 'react';
import { Box } from '@chakra-ui/react';

interface ColorBoxProps {
  color: string;
  onClick?: () => void;
}

export const ColorBox: React.React.FC<ColorBoxProps> = ({ color, onClick }) => (
  <Box
    width="40px"
    height="40px"
    backgroundColor={color}
    cursor="pointer"
    border="2px solid white"
    borderRadius="4px"
    _hover={{ opacity: 0.8 }}
    onClick={onClick}
  />
);