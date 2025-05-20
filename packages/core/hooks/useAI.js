import { useState, useEffect, useCallback } from 'react';
import { InsightEngine } from '../ai/InsightEngine.js';
import { OptimizationEngine } from '../ai/OptimizationEngine.js';
import { SearchEngine } from '../ai/SearchEngine.js';
export function useAI(analyticsManager, dashboardId, dashboardState) {
    const [insightEngine] = useState(() => new InsightEngine(analyticsManager));
    const [optimizationEngine] = useState(() => new OptimizationEngine(analyticsManager));
    const [searchEngine] = useState(() => new SearchEngine(analyticsManager));
    const [insights, setInsights] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [searchResults, setSearchResults] = useState({
        results: [],
        total: 0,
        suggestions: [],
    });
    // Generate insights
    const generateInsights = useCallback(async () => , () => , (configs) => {
        const newInsights = await(insightEngine).generateInsights(dashboardId, configs);
        setInsights(newInsights);
        return newInsights;
    }, [insightEngine, dashboardId]);
    // Get optimization suggestions
    const getOptimizationSuggestions = useCallback(async () => , () => , () => {
        const newSuggestions = await(optimizationEngine).analyzeDashboard(dashboardId, dashboardState);
        setSuggestions(newSuggestions);
        return newSuggestions;
    }, [optimizationEngine, dashboardId, dashboardState]);
    // Search functionality
    const search = useCallback(async () => , () => , (config) => {
        const results = await(searchEngine).search(config);
        setSearchResults(results);
        return results;
    }, [searchEngine]);
    // Index dashboard content
    const indexDashboard = useCallback(async () => , () => , () => {
        await(searchEngine).indexDashboard(dashboardState);
    }, [searchEngine, dashboardState]);
    // Auto-update insights and suggestions
    useEffect(() => {
        const updateInterval = setInterval(async () => , () => , () => {
            // Update insights
            await generateInsights([
                {
                    type: 'trend',
                    metric: 'views',
                    timeframe: 'day',
                },
                {
                    type: 'anomaly',
                    metric: 'performance',
                    timeframe: 'hour',
                },
                {
                    type: 'recommendation',
                    metric: 'engagement',
                    timeframe: 'week',
                },
            ]);
            // Update suggestions
            await getOptimizationSuggestions();
        }, 5 * 60 * 1000); // Update every 5 minutes
        return () => clearInterval(updateInterval);
    }, [generateInsights, getOptimizationSuggestions]);
    // Initial data load
    useEffect(() => {
        generateInsights([
            {
                type: 'trend',
                metric: 'views',
                timeframe: 'day',
            },
            {
                type: 'anomaly',
                metric: 'performance',
                timeframe: 'hour',
            },
            {
                type: 'recommendation',
                metric: 'engagement',
                timeframe: 'week',
            },
        ]);
        getOptimizationSuggestions();
        indexDashboard();
    }, [generateInsights, getOptimizationSuggestions, indexDashboard]);
    return {
        insights,
        suggestions,
        searchResults,
        generateInsights,
        getOptimizationSuggestions,
        search,
        indexDashboard,
    };
}
//# sourceMappingURL=useAI.js.map