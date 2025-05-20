var _a;
export {}
exports.fetchData = exports.fetchDataFailure = exports.fetchDataSuccess = exports.fetchDataStart = void 0;
import toolkit_1 from '@reduxjs/toolkit';
import fetcher_1 from '../../services/api/fetcher.js';
const initialState = {
    data: null,
    loading: false,
    error: null
};
const apiSlice = (0, toolkit_1.createSlice)({
    name: 'api',
    initialState,
    reducers: {
        fetchDataStart(state) {
            state.loading = true;
            state.error = null;
        },
        fetchDataSuccess(state, action) {
            state.data = action.payload;
            state.loading = false;
        },
        fetchDataFailure(state, action) {
            state.error = action.payload;
            state.loading = false;
        }
    }
});
_a = apiSlice.actions, exports.fetchDataStart = _a.fetchDataStart, exports.fetchDataSuccess = _a.fetchDataSuccess, exports.fetchDataFailure = _a.fetchDataFailure;
const fetchData = (endpoint, params): any => async (dispatch) => {
    try {
        dispatch((0, exports.fetchDataStart)());
        const response = await fetcher_1.default.get(endpoint, params);
        dispatch((0, exports.fetchDataSuccess)(response.data));
    }
    catch (error) {
        dispatch((0, exports.fetchDataFailure)(error.message));
    }
};
exports.fetchData = fetchData;
exports.default = apiSlice.reducer;
export {};
//# sourceMappingURL=api.js.map