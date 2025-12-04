import React from 'react';
interface OnboardingStepsConfigProps {
    onSave: () => void;
    onChange: () => void;
    hasUnsavedChanges: boolean;
}
export declare const OnboardingStepsConfig: React.FC<OnboardingStepsConfigProps>;
export {};
