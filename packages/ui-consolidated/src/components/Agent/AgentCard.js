import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Edit, ExternalLink, Info, PauseCircle, PlayCircle, Settings, Trash } from 'lucide-react';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, } from '../Card/Card';
const statusColors = {
    // Uppercase status values
    IDLE: 'bg-green-100 text-green-800',
    BUSY: 'bg-yellow-100 text-yellow-800',
    ERROR: 'bg-red-100 text-red-800',
    OFFLINE: 'bg-gray-100 text-gray-800',
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-gray-100 text-gray-800',
    PENDING: 'bg-blue-100 text-blue-800',
    DELETED: 'bg-red-100 text-red-800',
    INITIALIZING: 'bg-blue-100 text-blue-800',
    READY: 'bg-green-100 text-green-800',
    TERMINATED: 'bg-red-100 text-red-800',
    LEARNING: 'bg-purple-100 text-purple-800',
    // Lowercase status values
    idle: 'bg-green-100 text-green-800',
    busy: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    offline: 'bg-gray-100 text-gray-800',
    active: 'bg-green-100 text-green-800',
};
export const AgentCard = ({ agent, onSelect, onStart, onStop, onEdit, onDelete, onViewDetails, onConfigureEndpoints, className = '', compact = false, showProtocols = false, showEndpoints = false, showSecurity = false, }) => {
    // Normalize status to handle both uppercase and lowercase values
    const normalizedStatus = agent.status.toString().toUpperCase();
    const isActive = normalizedStatus === 'ACTIVE' || normalizedStatus === 'IDLE';
    // Get status color with fallback
    const statusColor = statusColors[agent.status] || 'bg-gray-100 text-gray-800';
    return (_jsxs(Card, { className: className, variant: "default", size: compact ? 'sm' : 'default', hoverable: true, children: [_jsxs(CardHeader, { children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { className: "text-lg font-medium text-gray-900", children: agent.name }), _jsx(Badge, { className: statusColor, children: agent.status })] }), !compact && (_jsxs("div", { className: "mt-1", children: [_jsx(CardDescription, { className: "text-sm text-gray-500", children: agent.description }), _jsxs("p", { className: "text-xs text-gray-400 mt-1", children: ["Type: ", agent.type] }), agent.role && _jsxs("p", { className: "text-xs text-gray-400", children: ["Role: ", agent.role] })] }))] }), _jsxs(CardContent, { className: "space-y-4", children: [!compact && (_jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-700", children: "Capabilities" }), _jsx("div", { className: "mt-1 flex flex-wrap gap-1", children: agent.capabilities.map((capability) => (_jsx(Badge, { className: "px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs", children: capability }, capability))) })] })), showProtocols && agent.protocols && agent.protocols.length > 0 && (_jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-700", children: "Protocols" }), _jsx("div", { className: "mt-1 flex flex-wrap gap-1", children: agent.protocols.map((protocol) => (_jsx(Badge, { className: "px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs", children: protocol }, protocol))) })] })), showEndpoints && agent.endpoints && (_jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-700", children: "Endpoints" }), _jsxs("div", { className: "mt-1 space-y-1 text-xs text-gray-500", children: [agent.endpoints.discovery && (_jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "font-medium mr-1", children: "Discovery:" }), _jsx("span", { className: "truncate", children: agent.endpoints.discovery }), _jsx(ExternalLink, { className: "h-3 w-3 ml-1 cursor-pointer", onClick: () => window.open(agent.endpoints.discovery, '_blank') })] })), agent.endpoints.messaging && (_jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "font-medium mr-1", children: "Messaging:" }), _jsx("span", { className: "truncate", children: agent.endpoints.messaging })] }))] })] })), showSecurity && agent.security && (_jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-700", children: "Security" }), _jsxs("div", { className: "mt-1 space-y-1 text-xs text-gray-500", children: [_jsxs("div", { children: ["Authentication: ", agent.security.authentication || 'none'] }), _jsxs("div", { children: ["Encryption: ", agent.security.encryption ? 'Enabled' : 'Disabled'] }), agent.security.rateLimit && (_jsxs("div", { children: ["Rate Limit: ", agent.security.rateLimit, " req/min"] }))] })] })), !compact && agent.metadata && (_jsxs("div", { className: "flex items-center justify-between text-sm text-gray-500", children: [agent.metadata.version && _jsxs("span", { children: ["Version: ", agent.metadata.version] }), agent.metadata.lastActive && (_jsxs("span", { children: ["Last active: ", new Date(agent.metadata.lastActive).toLocaleString()] }))] }))] }), _jsxs(CardFooter, { className: "flex justify-end space-x-2", children: [onSelect && (_jsx(Button, { variant: "ghost", size: "sm", onClick: () => onSelect(agent), children: "Select" })), onViewDetails && (_jsx(Button, { variant: "ghost", size: "sm", onClick: () => onViewDetails(agent), icon: _jsx(Info, { className: "h-4 w-4" }), children: "Details" })), onConfigureEndpoints && (_jsx(Button, { variant: "ghost", size: "sm", onClick: () => onConfigureEndpoints(agent), icon: _jsx(Settings, { className: "h-4 w-4" }), children: "Configure" })), isActive && onStop && (_jsx(Button, { variant: "ghost", size: "sm", onClick: () => onStop(agent), icon: _jsx(PauseCircle, { className: "h-4 w-4" }), children: "Stop" })), !isActive && onStart && (_jsx(Button, { variant: "ghost", size: "sm", onClick: () => onStart(agent), icon: _jsx(PlayCircle, { className: "h-4 w-4" }), children: "Start" })), onEdit && (_jsx(Button, { variant: "ghost", size: "sm", onClick: () => onEdit(agent), icon: _jsx(Edit, { className: "h-4 w-4" }), children: "Edit" })), onDelete && (_jsx(Button, { variant: "ghost", size: "sm", onClick: () => onDelete(agent), icon: _jsx(Trash, { className: "h-4 w-4" }), children: "Delete" }))] })] }));
};
