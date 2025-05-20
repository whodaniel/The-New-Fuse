import React from 'react';
interface AgentDetailsProps {
    name: string;
    status: string;
    avatar: string;
    performance: number;
    capabilities: string[];
    model: string;
}
declare const AgentDetails: React.React.FC<AgentDetailsProps>;
export default AgentDetails;
