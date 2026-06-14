"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLoading = useLoading;
exports.useAsync = useAsync;
/**
 * Loading State Hook
 * Simplifies loading state management for async operations
 */
const react_1 = require("react");
/**
 * Simple loading state hook with loading wrapper function
 */
function useLoading(initialState = false) {
    const [isLoading, setIsLoading] = (0, react_1.useState)(initialState);
    const withLoading = (0, react_1.useCallback)(async (asyncFn) => {
        setIsLoading(true);
        try {
            const result = await asyncFn();
            return result;
        }
        catch (error) {
            throw error;
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    const startLoading = (0, react_1.useCallback)(() => setIsLoading(true), []);
    const stopLoading = (0, react_1.useCallback)(() => setIsLoading(false), []);
    return {
        isLoading,
        setIsLoading,
        withLoading,
        startLoading,
        stopLoading,
    };
}
/**
 * Advanced async hook with data and error state management
 */
function useAsync(asyncFunction, immediate = false) {
    const [state, setState] = (0, react_1.useState)({
        isLoading: immediate,
        error: null,
        data: null,
    });
    const execute = (0, react_1.useCallback)(async (...args) => {
        setState({ isLoading: true, error: null, data: null });
        try {
            const response = await asyncFunction(...args);
            setState({ isLoading: false, error: null, data: response });
            return response;
        }
        catch (error) {
            setState({ isLoading: false, error: error, data: null });
            return undefined;
        }
    }, [asyncFunction]);
    const reset = (0, react_1.useCallback)(() => {
        setState({ isLoading: false, error: null, data: null });
    }, []);
    return {
        isLoading: state.isLoading,
        error: state.error,
        data: state.data,
        execute,
        reset,
    };
}
//# sourceMappingURL=useLoading.js.map