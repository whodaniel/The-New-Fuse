import { MotionConfig } from 'framer-motion';
import { ReactNode } from 'react';

export const MotionProvider = ({ children }: { children: ReactNode }) => {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
};
