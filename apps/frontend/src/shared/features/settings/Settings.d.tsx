import React from 'react';
interface SettingsProps {
    onSettingChange?: (setting: string, value: any) => void;
}
export declare function Settings({ onSettingChange }: SettingsProps): React.JSX.Element;
export {};
