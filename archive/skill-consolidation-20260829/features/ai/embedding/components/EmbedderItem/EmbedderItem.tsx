import React from 'react';
import Image from 'next/image';

interface EmbedderItemProps {
  name: string;
  value: string;
  logo: string;
  description: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export function EmbedderItem({
  name,
  value,
  logo,
  description,
  isSelected = false,
  onClick
}: EmbedderItemProps) {
  return (
    <div
      className={`flex items-center gap-x-3 p-3 rounded-lg cursor-pointer border ${
        isSelected ? 'border-primary-button bg-primary-button bg-opacity-10' : 'border-transparent hover:bg-theme-hover'
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      data-value={value}
    >
      <div className="h-10 w-10 relative rounded-lg overflow-hidden">
        <Image
          src={logo}
          alt={`${name} logo`}
          fill
          style={{ objectFit: 'cover' }}
          sizes="40px"
        />
      </div>
      <div className="flex flex-col">
        <span className="text-white font-medium">{name}</span>
        <span className="text-white text-opacity-60 text-sm">{description}</span>
      </div>
    </div>
  );
}
//# sourceMappingURL=EmbedderItem.js.map