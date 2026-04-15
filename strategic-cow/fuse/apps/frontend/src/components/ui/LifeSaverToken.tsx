'use client';

import { useState } from 'react';

interface LifeSaverTokenProps {
  position: number;
  onTransfer: () => void;
  color?: string;
}

export function LifeSaverToken({ position, onTransfer, color = '#FF6B6B' }: LifeSaverTokenProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleClick = () => {
    onTransfer();
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 2000);
  };

  return (
    <div className="relative">
      <div
        className={`lifesaver-token cursor-pointer transition-all duration-200 ${
          isHovered ? 'scale-110' : 'scale-100'
        }`}
        style={{
          left: `${10 + position * 40}px`,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        <div className="relative w-8 h-8 group">
          <div
            className="absolute inset-0 rounded-full shadow-lg transition-shadow duration-200 group-hover:shadow-xl"
            style={{ backgroundColor: color }}
          />
          <div className="absolute inset-2 bg-white rounded-full shadow-inner">
            <div className="absolute inset-1 rounded-full" style={{ backgroundColor: color }} />
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="absolute right-10 top-1/2 transform -translate-y-1/2 bg-green-500 text-white px-2 py-0.5 rounded-full text-xs whitespace-nowrap shadow-lg animate-fade-in">
          Token transferred!
        </div>
      )}
    </div>
  );
}

interface LifeSaverTokenContainerProps {
  tokens: number;
  onTransfer: (index: number) => void;
}

export function LifeSaverTokenContainer({ tokens, onTransfer }: LifeSaverTokenContainerProps) {
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#FFE66D',
    '#95E1D3',
    '#FF8B94',
    '#A8E6CF',
    '#DCD6F7',
    '#F7D794',
    '#B8E9C0',
    '#F6C6EA',
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t py-2 px-4 flex justify-center z-50">
      <div className="token-container relative h-8 flex gap-2">
        {Array.from({ length: tokens }).map((_, index) => (
          <LifeSaverToken
            key={index}
            position={index}
            onTransfer={() => onTransfer(index)}
            color={colors[index % colors.length]}
          />
        ))}
      </div>
    </div>
  );
}
