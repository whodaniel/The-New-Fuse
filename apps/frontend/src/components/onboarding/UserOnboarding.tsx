import React from 'react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { FeatureTour } from './FeatureTour';
import { GettingStartedGuide } from './GettingStartedGuide';

export const UserOnboarding: React.FC = () => {
  const { step, progress, complete } = useOnboarding();

  return (
    <>
      <FeatureTour
        currentStep={step}
        onComplete={complete}
      />
      <GettingStartedGuide
        progress={progress}
        interactive
      />
    </>
  );
};
