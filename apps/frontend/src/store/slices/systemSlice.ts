export {}
exports.createSystemSlice = void 0;
const createSystemSlice = (set): any => ({
    isLoading: false,
    error: null,
    setLoading: (loading) => {
        set({ isLoading: loading });
    },
    setError: (error) => {
        set({ error });
    },
});
exports.createSystemSlice = createSystemSlice;
export {};
//# sourceMappingURL=systemSlice.js.map