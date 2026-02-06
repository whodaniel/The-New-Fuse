import { MotionConfig } from 'framer-motion';
export const MotionProvider = ({ children }): any => {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
};
