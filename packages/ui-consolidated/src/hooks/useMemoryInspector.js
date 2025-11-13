import { useState, useEffect } from 'react';
export function useMemoryInspector(agentId) {
    const [items, setItems] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        async function fetchMemory() {
            try {
                // Placeholder: replace with real API call
                const url = agentId ? `/api/memory/items?agentId=${agentId}` : '/api/memory/items';
                const resp = await fetch(url);
                const data = await resp.json();
                setItems(data.items);
                setStats(data.stats);
            }
            catch (err) {
                setError(err.message);
            }
            finally {
                setLoading(false);
            }
        }
        fetchMemory();
    }, [agentId]);
    return { items, stats, loading, error };
}
//# sourceMappingURL=useMemoryInspector.js.map