import React, { Suspense } from 'react';
import { useInView } from '@/hooks/useInView';

export const LazyLoader: React.React.FC<{
  component: React.LazyExoticComponent<any>;
  fallback?: React.ReactNode;
}> = ({ component: Component, fallback }) => {
  const [ref, inView] = useInView();

  return (
    <div ref={ref}>
      {inView && (
        <Suspense fallback={fallback}>
          <Component />
        </Suspense>
      )}
    </div>
  );
};