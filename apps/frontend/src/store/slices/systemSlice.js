exports.createSystemSlice = void 0;
var createSystemSlice = function (set) { return ({
    isLoading: false,
    error: null,
    setLoading: function (loading) {
        set({ isLoading: loading });
    },
    setError: function (error) {
        set({ error: error });
    },
}); };
exports.createSystemSlice = createSystemSlice;
export {};
