import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMetrics } from '../../../hooks/useMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '../../Card/Card';
import { List, ListItem } from '../../List/List';
import { Skeleton } from '../../Skeleton/Skeleton';
import { Alert, AlertDescription, AlertTitle } from '../../Alert/Alert';
export const MetricsDashboard = () => {
    const { data, loading, error } = useMetrics();
    if (loading)
        return _jsx(Skeleton, {});
    if (error || !data)
        return (_jsxs(Alert, { children: [_jsx(AlertTitle, { children: "Error" }), _jsx(AlertDescription, { children: error })] }));
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Metrics Dashboard" }) }), _jsxs(CardContent, { children: [_jsxs("section", { children: [_jsx("h3", { children: "Step Metrics" }), _jsx(List, { children: data.stepMetrics.map((metric) => (_jsx(ListItem, { children: _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: metric.name }), _jsx("span", { children: metric.value })] }) }, metric.id))) })] }), _jsxs("section", { children: [_jsx("h3", { children: "Memory Metrics" }), _jsxs("p", { children: ["Total Items: ", data.memoryMetrics.totalItems] }), _jsxs("p", { children: ["Hit Rate: ", data.memoryMetrics.hitRate, "%"] })] })] })] }));
};
