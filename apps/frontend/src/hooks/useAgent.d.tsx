import { Agent } from '@the-new-fuse/types';
interface UseAgentResult {
    agent: Agent | null;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}
export declare function useAgent(id: string | undefined): UseAgentResult;
export default useAgent;
