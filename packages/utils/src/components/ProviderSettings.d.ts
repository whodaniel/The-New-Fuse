import * as React from 'react';
export interface ProviderSettings {
    apiKey: string;
}
interface ProviderSettingsProps {
    onProviderChange: (provider: string, model: string) => void;
}
declare const ProviderSettings: React.FC<ProviderSettingsProps>;
export default ProviderSettings;
//# sourceMappingURL=ProviderSettings.d.ts.map