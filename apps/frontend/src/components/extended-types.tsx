import { Button as ButtonBase } from '@/components/core';
import { ComponentProps } from 'react';
import { Card as CardBase } from './card';

export { ButtonBase };

export type ExtendedCardProps = ComponentProps<typeof CardBase> & {
  className?: string;
};

export type ExtendedButtonProps = ComponentProps<typeof ButtonBase> & {
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
};
