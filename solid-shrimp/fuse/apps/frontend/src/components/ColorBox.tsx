import React from 'react';

interface ColorBoxProps {
  color: string;
  onClick?: () => void;
}

export const ColorBox: React.FC<ColorBoxProps> = ({ color, onClick }) => (
  <div
    style={{ backgroundColor: color }}
    className="w-10 h-10 cursor-pointer border-2 border-white rounded hover:opacity-80"
    onClick={onClick}
  />
);
