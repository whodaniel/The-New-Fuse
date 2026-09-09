import { UserTypeDetection } from '@/components/onboarding/UserTypeDetection';
import { OnboardingWizard } from '@/components/wizard/OnboardingWizard';
import { WizardProvider } from '@/components/wizard/WizardProvider';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const OnboardingFlow: React.FC = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'human' | 'ai_agent' | 'unknown' | null>(null);

  const handleDetectionComplete = (detectedUserType: 'human' | 'ai_agent' | 'unknown') => {
    setUserType(detectedUserType);
  };

  const handleOnboardingComplete = (userData: any) => {
    console.log(`${userType === 'ai_agent' ? 'AI agent' : 'Human'} onboarding complete:`, userData);

    // Navigate to the appropriate page based on user type
    if (userType === 'ai_agent') {
      navigate('/ai-portal');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8">
      {/* Escape hatch — onboarding is a bare layout with no shell navigation,
          so give the user an explicit way out that doesn't require finishing
          (or fighting through) the wizard. */}
      <div className="fixed right-4 top-4 z-50">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="rounded-full bg-slate-950/80 backdrop-blur-md px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300 shadow-lg ring-1 ring-white/10 transition-colors hover:bg-slate-900 hover:text-white"
        >
          Skip for now → Dashboard
        </button>
      </div>
      {userType === null ? (
        <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-md shadow-md p-4">
          <UserTypeDetection onDetectionComplete={handleDetectionComplete} />
        </div>
      ) : (
        <WizardProvider>
          <OnboardingWizard userType={userType} onComplete={handleOnboardingComplete} />
        </WizardProvider>
      )}
    </div>
  );
};

export default OnboardingFlow;
