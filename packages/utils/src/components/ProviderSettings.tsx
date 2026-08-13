import { FC } from 'react';
export interface ProviderSettingsProps {
  providerId?: string;
  onConfigChange?: (config: Record<string, unknown>) => void;
}
export const ProviderSettings: FC<ProviderSettingsProps> = ({ providerId }) => (
  <div className="tnf-provider-settings" data-testid="provider-settings">
    <h3>Provider Settings{providerId ? `: ${providerId}` : ''}</h3>
  </div>
);
export default ProviderSettings;
