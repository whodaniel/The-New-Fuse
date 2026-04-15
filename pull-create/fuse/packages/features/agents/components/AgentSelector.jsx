"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentSelector = void 0;
import jsx_runtime_1 from 'react/jsx-runtime';
const AgentSelector = ({ agents, selectedAgent, onSelect, }) => {
    const getStatusColor;
    (status > {
        switch(status) {
        },
        case: 'online', return: 'bg-green-500',
        case: 'offline', return: 'bg-gray-500',
        case: 'busy', return: 'bg-yellow-500',
        default: , return: 'bg-gray-500'
    });
};
exports.AgentSelector = AgentSelector;
return ((0, jsx_runtime_1.jsx)(scroll_area_1.ScrollArea, { className: "h-[500px]", children: (0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: agents.map((agent) => ((0, jsx_runtime_1.jsx)(card_1.Card, { className: `cursor-pointer transition-colors hover:bg-gray-100 ${selectedAgent?.id === agent.id ? 'border-primary' : ''}`, onClick: () => onSelect(agent), children: (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "flex items-center p-4", children: [(0, jsx_runtime_1.jsxs)(avatar_1.Avatar, { className: "h-10 w-10", children: [(0, jsx_runtime_1.jsx)(avatar_1.AvatarImage, { src: agent.avatar }), (0, jsx_runtime_1.jsx)(avatar_1.AvatarFallback, { children: agent.name[0] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "ml-4 flex-1", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-medium", children: agent.name }), (0, jsx_runtime_1.jsx)("div", { className: `ml-2 h-2 w-2 rounded-full ${getStatusColor(agent.status)}` })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500", children: agent.type })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex flex-wrap gap-1", children: agent.capabilities.map((capability) => ((0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "secondary", children: capability }, capability))) })] }) }, agent.id))) }) }));
;
//# sourceMappingURL=AgentSelector.js.map