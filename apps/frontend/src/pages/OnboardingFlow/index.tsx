import React, { useState } from 'react';
import { UserTypeDetection } from '../../components/onboarding/UserTypeDetection';
import { OnboardingWizard } from '../../components/wizard/OnboardingWizard';
import { WizardProvider } from '../../components/wizard/WizardProvider';
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
      {userType === null ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <UserTypeDetection onDetectionComplete={handleDetectionComplete} />
        </div>
      ) : (
        <WizardProvider>
          <OnboardingWizard
            userType={userType}
            onComplete={handleOnboardingComplete}
          />
        </WizardProvider>
      )}
    </div>
  );
};

export default OnboardingFlow;
