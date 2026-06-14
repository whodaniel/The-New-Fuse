/**
 * Wizard UI Components
 *
 * React components for rendering wizard flows
 */
import React from 'react';
import { WizardDefinition, WizardProgress, WizardStateManager } from './WizardSystem.js';
export interface WizardUIProps {
    wizard: WizardDefinition;
    userId: string;
    userRole: string;
    stateManager: WizardStateManager;
    onComplete?: (progress: WizardProgress) => void;
    onCancel?: () => void;
}
/**
 * Main Wizard Component
 */
export declare const Wizard: React.FC<WizardUIProps>;
/**
 * Wizard Progress Indicator
 */
interface WizardProgressProps {
    current: number;
    total: number;
    percentage: number;
}
declare const WizardProgress: React.FC<WizardProgressProps>;
/**
 * Wizard List - Show available wizards
 */
export interface WizardListProps {
    wizards: WizardDefinition[];
    onSelectWizard: (wizard: WizardDefinition) => void;
    userProgress?: WizardProgress[];
}
export declare const WizardList: React.FC<WizardListProps>;
export default Wizard;
//# sourceMappingURL=WizardUI.d.ts.map