import { OnboardingWizard } from '@/components/wizard/OnboardingWizard';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Onboarding Preview Page
 *
 * This page provides a preview of the onboarding wizard for administrators
 * to test and validate the onboarding experience.
 */
const OnboardingPreview: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);

  // Get user type from URL params, default to 'human'
  const userType = searchParams.get('userType') || 'human';

  useEffect(() => {
    // Simulate loading configuration
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleComplete = (data: any) => {
    console.log('Onboarding completed with data:', data);
    // In a preview, we don't need to do anything with the data
    alert(
      'Onboarding completed successfully! In a real environment, the user would be redirected to the dashboard.'
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading onboarding preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-8">
      <OnboardingWizard userType={userType as 'human' | 'ai_agent'} onComplete={handleComplete} />
    </div>
  );
};

export default OnboardingPreview;
