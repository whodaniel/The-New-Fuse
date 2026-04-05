import { useState, useEffect } from 'react';
export function useMetrics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        async function fetchMetrics() {
            try {
                const resp = await fetch('/api/metrics');
                const json = await resp.json();
                setData(json);
            }
            catch (err) {
                setError(err.message);
            }
            finally {
                setLoading(false);
            }
        }
        fetchMetrics();
    }, []);
    return { data, loading, error };
}
