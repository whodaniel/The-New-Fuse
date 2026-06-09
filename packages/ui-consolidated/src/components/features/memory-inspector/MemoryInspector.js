import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemoryInspector } from '../../../hooks/useMemoryInspector';
import { Card, CardContent, CardHeader, CardTitle } from '../../Card/Card';
import { List, ListItem } from '../../List/List';
import { ScrollArea } from '../../ScrollArea/ScrollArea';
import { Badge } from '../../Badge/Badge';
const MemoryInspector = ({ agentId }) => {
    const { items, loading, error } = useMemoryInspector(agentId);
    if (loading)
        return _jsx("div", { children: "Loading memory..." });
    if (error)
        return _jsxs("div", { children: ["Error: ", error] });
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Memory Inspector" }) }), _jsx(CardContent, { children: _jsx(ScrollArea, { className: "h-64", children: _jsx(List, { children: items.map((item) => (_jsxs(ListItem, { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: item.content }), _jsx("p", { className: "text-sm text-muted-foreground", children: new Date(item.timestamp).toLocaleString() })] }), _jsx(Badge, { variant: item.type === 'core' ? 'default' : 'secondary', children: item.type })] }, item.id))) }) }) })] }));
};
export default MemoryInspector;
