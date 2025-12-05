import React from 'react';
interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}
declare const Loading: React.FC<LoadingProps>;
export declare const FullScreenLoader: React.FC;
export default Loading;
