/**
 * Profile Setup - User profile configuration step
 */
import React from 'react';
import { WizardContext } from '../WizardSystem.js';
export interface ProfileSetupProps {
    context: WizardContext;
    onDataChange: (data: Record<string, unknown>) => void;
    validationErrors?: string[];
}
export declare const ProfileSetup: React.FC<ProfileSetupProps>;
//# sourceMappingURL=ProfileSetup.d.ts.map