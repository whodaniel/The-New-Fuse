import { cn } from '@/lib/utils';
import { Minus, Plus, TextQuote } from 'lucide-react';
import React from 'react';

interface TextSizeMenuProps {
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
  className?: string;
}

const TextSizeMenu: React.FC<TextSizeMenuProps> = ({
  fontSize = 14,
  onFontSizeChange,
  className,
}) => {
  const sizes = [12, 14, 16, 18, 20];

  const increaseSize = () => {
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex < sizes.length - 1 && onFontSizeChange) {
      onFontSizeChange(sizes[currentIndex + 1]);
    }
  };

  const decreaseSize = () => {
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex > 0 && onFontSizeChange) {
      onFontSizeChange(sizes[currentIndex - 1]);
    }
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <button
        onClick={decreaseSize}
        className="p-1.5 hover:bg-slate-100 rounded transition-colors"
        disabled={fontSize <= sizes[0]}
      >
        <Minus className="w-3 h-3" />
      </button>

      <div className="flex items-center gap-1 px-2 text-sm">
        <TextQuote className="w-3 h-3" />
        <span>{fontSize}px</span>
      </div>

      <button
        onClick={increaseSize}
        className="p-1.5 hover:bg-slate-100 rounded transition-colors"
        disabled={fontSize >= sizes[sizes.length - 1]}
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
};

export default TextSizeMenu;
