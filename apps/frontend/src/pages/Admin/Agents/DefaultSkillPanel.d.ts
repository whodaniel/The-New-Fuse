import React from 'react';
interface DefaultSkillPanelProps {
    title: string;
    description?: string;
    enabled?: boolean;
    onToggle?: (enabled: boolean) => void;
}
declare const DefaultSkillPanel: React.FC<DefaultSkillPanelProps>;
export default DefaultSkillPanel;
