export function useAgent(id): any {
    const [agent, setAgent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchAgent = async () => {
        if (!id) {
            setError(new Error('No agent ID provided'));
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const response = await fetch(`/api/agents/${id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch agent');
            }
            const data = await response.json();
            setAgent(data);
            setError(null);
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch agent'));
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchAgent();
    }, [id]);
    return {
        agent,
        loading,
        error,
        refetch: fetchAgent
    };
}
export default useAgent;
//# sourceMappingURL=useAgent.js.map