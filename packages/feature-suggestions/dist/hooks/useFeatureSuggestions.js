"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFeatureSuggestions = void 0;
const react_1 = require("react");
const types_1 = require("../types");
const useFeatureSuggestions = ({ suggestionService }) => {
    const [suggestions, setSuggestions] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const loadSuggestions = (0, react_1.useCallback)(async () => {
        try {
            setLoading(true);
            const data = await suggestionService.getPopularSuggestions();
            setSuggestions(data);
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load suggestions'));
        }
        finally {
            setLoading(false);
        }
    }, [suggestionService]);
    const submitSuggestion = (0, react_1.useCallback)(async (title, description, submittedBy, priority, tags) => {
        try {
            const newSuggestion = await suggestionService.submitSuggestion({
                title,
                description,
                submittedBy,
                priority,
                tags,
                status: types_1.SuggestionStatus.PENDING
            });
            await loadSuggestions();
            return newSuggestion;
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to submit suggestion'));
            throw err;
        }
    }, [suggestionService, loadSuggestions]);
    const voteSuggestion = (0, react_1.useCallback)(async (suggestionId, userId) => {
        try {
            await suggestionService.voteSuggestion(suggestionId, userId);
            await loadSuggestions();
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to vote for suggestion'));
            throw err;
        }
    }, [suggestionService, loadSuggestions]);
    const convertToFeature = (0, react_1.useCallback)(async (suggestionId) => {
        try {
            const convertedSuggestion = await suggestionService.convertToFeature(suggestionId);
            await loadSuggestions();
            return convertedSuggestion;
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to convert suggestion to feature'));
            throw err;
        }
    }, [suggestionService, loadSuggestions]);
    const updateSuggestionStatus = (0, react_1.useCallback)(async (suggestionId, newStatus) => {
        try {
            await suggestionService.updateSuggestionStatus(suggestionId, newStatus);
            await loadSuggestions();
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to update suggestion status'));
            throw err;
        }
    }, [suggestionService, loadSuggestions]);
    // Alias for convertToFeature to match what FeatureManagementView expects
    const convertSuggestionToFeature = convertToFeature;
    const addTodo = (0, react_1.useCallback)(async (title, description, priority, suggestionId, assignedTo, dueDate) => {
        try {
            const newTodo = await suggestionService.addTodo({
                title,
                description,
                priority,
                suggestionId,
                assignedTo,
                dueDate
            });
            await loadSuggestions();
            return newTodo;
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to create todo'));
            throw err;
        }
    }, [suggestionService, loadSuggestions]);
    const addComment = (0, react_1.useCallback)(async (suggestionId, content, authorId) => {
        try {
            const newComment = await suggestionService.addComment({
                suggestionId,
                content,
                authorId
            });
            await loadSuggestions();
            return newComment;
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to add comment'));
            throw err;
        }
    }, [suggestionService, loadSuggestions]);
    return {
        suggestions,
        loading,
        error,
        submitSuggestion,
        voteSuggestion,
        convertToFeature,
        updateSuggestionStatus,
        convertSuggestionToFeature,
        addTodo,
        addComment,
        refresh: loadSuggestions,
    };
};
exports.useFeatureSuggestions = useFeatureSuggestions;
//# sourceMappingURL=useFeatureSuggestions.js.map