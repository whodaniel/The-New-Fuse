import React from 'react';
import { Agent } from '../types/agent.js';
import { Task } from '../types/task.js';
interface Node {
    id: string;
    name: string;
    x?: number;
    y?: number;
    __bckgDimensions?: [number, number];
}
interface AgentNetworkProps {
    agents: Agent[];
    tasks: Task[];
    onNodeClick: (node: Node) => void;
}
export declare const AgentNetwork: React.React.FC<AgentNetworkProps>;
export {};
