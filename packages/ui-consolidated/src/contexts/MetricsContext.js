import React, { createContext, useContext } from 'react';
const MetricsContext = createContext({
    metrics: [],
    loading: false,
    error: null,
});
export const useMetrics = () => useContext(MetricsContext);
export const MetricsProvider = ({ children }) => {
    const value = {
        metrics: [],
        loading: false,
        error: null,
    };
    return (<MetricsContext.Provider value={value}>
      {children}
    </MetricsContext.Provider>);
};
export default MetricsContext;
//# sourceMappingURL=MetricsContext.js.map