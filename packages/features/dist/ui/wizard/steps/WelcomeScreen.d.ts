/**
 * Welcome Screen - First step in Get Started wizard
 */
import React from 'react';
import { WizardContext } from '../WizardSystem.js';
export interface WelcomeScreenProps {
    context: WizardContext;
    onDataChange: (data: Record<string, unknown>) => void;
}
export declare const WelcomeScreen: React.FC<WelcomeScreenProps>;
//# sourceMappingURL=WelcomeScreen.d.ts.map