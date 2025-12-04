var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
// Create the Zustand store
var useStoreImpl = create()(devtools(function (set) { return ({
    // Initial state
    system: {
        // Determine initial development mode (e.g., from env vars or hostname)
        isDevelopment: process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost',
    },
    // user: { currentUser: null, isLoading: false },
    // Actions implementation
    setDevelopmentMode: function (isDev) {
        return set(function (state) { return ({ system: __assign(__assign({}, state.system), { isDevelopment: isDev }) }); }, false, 'setDevelopmentMode');
    },
    // Add other action implementations here
}); }, { name: 'AppStore' } // Name for Redux DevTools extension
));
// Export the hook for components to use
export var useStore = useStoreImpl;
// Optional: Export parts of the state or actions directly if needed
// export const useSystemState = () => useStore((state) => state.system);
