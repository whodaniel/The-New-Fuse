// @ts-nocheck
import { useInView } from '@/hooks/useInView';
import React, { Suspense } from 'react';

export const LazyLoader: React.FC<{
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
