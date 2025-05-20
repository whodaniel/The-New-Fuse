import { ComponentProps } from 'react';
import { Card as CardBase } from './card.js';
import { Button as ButtonBase } from '@/components/core';

export { ButtonBase };

export type ExtendedCardProps = ComponentProps<typeof CardBase> & {
  className?: string;
};

export type ExtendedButtonProps = ComponentProps<typeof ButtonBase> & {
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
};
