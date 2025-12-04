import { Agent } from '@the-new-fuse/types';
interface AgentState {
    agents: Agent[];
    loading: boolean;
    error: string | null;
}
export declare const fetchAgents: import("@reduxjs/toolkit").AsyncThunk<any, void, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const createAgent: import("@reduxjs/toolkit").AsyncThunk<any, Partial<Agent>, import("@reduxjs/toolkit").AsyncThunkConfig>;
declare const _default: import("redux").Reducer<AgentState>;
export default _default;
