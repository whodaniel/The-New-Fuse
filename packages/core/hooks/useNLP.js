import { useState, useCallback } from 'react';
import { NLPEngine } from '../ai/NLPEngine.js';
export function useNLP(searchEngine, dashboardState) {
    const [nlpEngine] = useState(() => new NLPEngine());
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState({
        searchResults: [],
        total: 0,
        suggestions: [],
    });
    const processNaturalLanguageQuery = useCallback(async () => , () => , (query) => {
        setIsProcessing(true);
        try {
            // Process query using NLP engine
            const nlpResult = await(nlpEngine).processQuery(query, dashboardState);
            // Generate search config from NLP result
            const searchConfig = await(nlpEngine).generateSearchConfig(nlpResult, dashboardState);
            // Execute search with generated config
            const searchResults = await(searchEngine).search(searchConfig);
            setResults(searchResults);
            return {
                nlpResult,
                searchResults,
            };
        }
        catch (error) {
            console.error('Error processing query:', error);
            throw error;
        }
        finally {
            setIsProcessing(false);
        }
    }, [nlpEngine, searchEngine, dashboardState]);
    return {
        processNaturalLanguageQuery,
        isProcessing,
        results,
    };
}
//# sourceMappingURL=useNLP.js.map