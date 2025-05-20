import { useState, useEffect } from 'react';

type TextSize = 'sm' | 'md' | 'lg';

interface UseTextSizeReturn {
  textSize: TextSize;
  textSizeClass: string;
  setTextSize: (size: TextSize) => void;
}

const TEXT_SIZE_KEY = 'chat_text_size';
const DEFAULT_SIZE: TextSize = 'md';

const sizeToClassMap: Record<TextSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg'
};

export default function useTextSize(): UseTextSizeReturn {
  const [textSize, setInternalTextSize] = useState<TextSize>(() => {
    if (typeof window === 'undefined') return DEFAULT_SIZE;
    return (localStorage.getItem(TEXT_SIZE_KEY) as TextSize) || DEFAULT_SIZE;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TEXT_SIZE_KEY, textSize);
    }
  }, [textSize]);

  const setTextSize = (size: TextSize): any => {
    setInternalTextSize(size);
  };

  return {
    textSize,
    textSizeClass: sizeToClassMap[textSize],
    setTextSize
  };
}
//# sourceMappingURL=useTextSize.js.map