import { useCallback, useEffect, useState } from 'react';
const JSON_HEADERS = { 'Content-Type': 'application/json' };
async function parse(res) {
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with ${res.status}`);
    }
    return res.json();
}
export const useFeatureSuggestions = () => {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const rows = await parse(await fetch('/api/suggestions'));
            setSuggestions(rows);
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load suggestions'));
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        refresh();
    }, [refresh]);
    const submitSuggestion = useCallback(async (input) => {
        await parse(await fetch('/api/suggestions', {
            method: 'POST',
            headers: JSON_HEADERS,
            body: JSON.stringify({
                title: input.title,
                description: input.description,
                owner: input.owner || 'ui-user',
                priority: input.priority || 'medium',
                tags: input.tags || [],
                source: input.source || 'api',
            }),
        }));
        await refresh();
    }, [refresh]);
    const voteSuggestion = useCallback(async (suggestionId, direction = 'up') => {
        await parse(await fetch(`/api/suggestions/${suggestionId}/vote`, {
            method: 'POST',
            headers: JSON_HEADERS,
            body: JSON.stringify({ direction }),
        }));
        await refresh();
    }, [refresh]);
    const convertToFeature = useCallback(async (suggestionId) => {
        await parse(await fetch(`/api/suggestions/${suggestionId}`, {
            method: 'PATCH',
            headers: JSON_HEADERS,
            body: JSON.stringify({ status: 'completed', metadata: { actor: 'ui-user' } }),
        }));
        await refresh();
    }, [refresh]);
    const addTodo = useCallback(async (input) => {
        return parse(await fetch('/api/tasks', {
            method: 'POST',
            headers: JSON_HEADERS,
            body: JSON.stringify({
                title: input.title,
                description: input.description || '',
                status: 'queued',
                source: 'api',
            }),
        }));
    }, []);
    const addComment = useCallback(async (recordId, note) => {
        return parse(await fetch(`/api/unified-ledger/records/${recordId}/feedback`, {
            method: 'POST',
            headers: JSON_HEADERS,
            body: JSON.stringify({
                hypothesis: `Comment on record ${recordId}`,
                evidence: [note],
                confidence: 0.7,
                accepted: true,
                notes: 'Comment captured via hooks/useFeatureSuggestions',
            }),
        }));
    }, []);
    return {
        suggestions,
        loading,
        error,
        submitSuggestion,
        voteSuggestion,
        convertToFeature,
        addTodo,
        addComment,
        refresh,
    };
};
