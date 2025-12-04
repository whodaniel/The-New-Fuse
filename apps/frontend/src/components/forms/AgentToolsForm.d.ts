import React from 'react';
import { AgentToolType } from '@the-new-fuse/types/src/agent';
interface AgentToolsFormProps {
    selectedTools: AgentToolType[];
    onChange: (tools: AgentToolType[]) => void;
}
export declare const AgentToolsForm: React.FC<AgentToolsFormProps>;
export {};
