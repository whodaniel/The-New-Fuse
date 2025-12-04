import { FeatureFlagConditions } from '@the-new-fuse/types/featureFlags';
interface FeatureFlagConditionsEditorProps {
    conditions: FeatureFlagConditions;
    onChange: (conditions: FeatureFlagConditions) => void;
}
export declare function FeatureFlagConditionsEditor({ conditions, onChange }: FeatureFlagConditionsEditorProps): import("react/jsx-runtime").JSX.Element;
export {};
