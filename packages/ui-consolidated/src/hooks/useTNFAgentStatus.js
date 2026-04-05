import { useEffect, useState } from 'react';
const TNF_WORKER_URL = 'https://tnf-agent-orchestration.bizsynth.workers.dev';
export function useTNFAgentStatus(refreshInterval = 5000) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await fetch(`${TNF_WORKER_URL}/agent/status`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                });
                if (!response.ok)
                    throw new Error(`Status fetch failed: ${response.status}`);
                const json = await response.json();
                setData(json);
                setError(null);
            }
            catch (err) {
                setError(err instanceof Error ? err : new Error(String(err)));
            }
            finally {
                setLoading(false);
            }
        };
        fetchStatus();
        const interval = setInterval(fetchStatus, refreshInterval);
        return () => clearInterval(interval);
    }, [refreshInterval]);
    return { data, loading, error };
}
// Agent emoji mapping for visual flair
export const AGENT_EMOJIS = {
    Antigravity: '👑',
    'PicoClaw-Tester': '🔍',
    'PicoClaw-Subject': '🧪',
    'PicoClaw-Perplexity': '📚',
};
export const STATUS_COLORS = {
    idle: 'bg-green-500',
    busy: 'bg-yellow-500',
    working: 'bg-blue-500',
    thinking: 'bg-purple-500',
    error: 'bg-red-500',
    offline: 'bg-gray-500',
};
