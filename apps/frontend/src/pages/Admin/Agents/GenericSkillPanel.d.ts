import React from 'react';
interface GenericSkillPanelProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
}
declare const GenericSkillPanel: React.FC<GenericSkillPanelProps>;
export default GenericSkillPanel;
