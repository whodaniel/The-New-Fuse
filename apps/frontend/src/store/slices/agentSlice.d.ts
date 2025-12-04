import { AppThunk } from '../index';
import { Agent } from '../../types/agent';
interface AgentState {
    agents: Agent[];
    loading: boolean;
    error: string | null;
}
export declare const fetchAgentsStart: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"agent/fetchAgentsStart">, fetchAgentsSuccess: import("@reduxjs/toolkit").ActionCreatorWithPayload<Agent[], "agent/fetchAgentsSuccess">, fetchAgentsFailure: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "agent/fetchAgentsFailure">, updateAgentSuccess: import("@reduxjs/toolkit").ActionCreatorWithPayload<any, "agent/updateAgentSuccess">, createAgentSuccess: import("@reduxjs/toolkit").ActionCreatorWithPayload<any, "agent/createAgentSuccess">;
export declare const fetchAgents: () => AppThunk;
export declare const updateAgent: (agentId: string, agentData: Partial<Agent>) => AppThunk;
export declare const createAgent: (agentData: Omit<Agent, "id">) => AppThunk;
declare const _default: import("redux").Reducer<AgentState>;
export default _default;
