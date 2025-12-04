import React from 'react';
export interface OnboardingWizardProps {
    userType: 'human' | 'ai_agent' | 'unknown';
    onComplete: (userData: any) => void;
}
export declare const OnboardingWizard: React.FC<OnboardingWizardProps>;
