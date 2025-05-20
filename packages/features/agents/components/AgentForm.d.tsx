import React from 'react';
import * as z from 'zod';
import { Agent } from '@/types';
declare const agentSchema: unknown;
type AgentFormData = z.infer<typeof agentSchema>;
interface AgentFormProps {
    initialData?: Agent;
    onSubmit: (data: AgentFormData) => void;
    availableModels: string[];
    availableCapabilities: string[];
}
export declare const AgentForm: React.FC<AgentFormProps>;
export {};
