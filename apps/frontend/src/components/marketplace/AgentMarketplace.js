import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Card } from '@/components/ui/card';
import { SearchInput } from '@/components/ui/search';
import { useAgentMarketplace } from '@/hooks/useAgentMarketplace';
export var AgentMarketplace = function () {
    var _a = useAgentMarketplace(), agents = _a.agents, loading = _a.loading, search = _a.search;
    var _b = React.useState(''), filter = _b[0], setFilter = _b[1];
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx(SearchInput, { value: filter, onChange: setFilter, placeholder: "Search agents..." }), _jsx(Select, { value: sortBy, onChange: setSortBy, options: [
                            { label: 'Most Popular', value: 'downloads' },
                            { label: 'Highest Rated', value: 'rating' },
                            { label: 'Newest', value: 'created' }
                        ] })] }), _jsx("div", { className: "grid grid-cols-3 gap-4", children: agents.map(function (agent) { return (_jsxs(Card, { className: "p-4", children: [_jsx("h3", { children: agent.name }), _jsx("p", { children: agent.description }), _jsx("div", { className: "flex gap-2", children: agent.capabilities.map(function (cap) { return (_jsx(Badge, { children: cap }, cap)); }) }), _jsxs("div", { className: "mt-4 flex justify-between", children: [_jsx(StarRating, { value: agent.rating }), _jsxs("span", { children: [agent.downloads, " downloads"] })] }), _jsx(Button, { className: "mt-4 w-full", onClick: function () { }, children: "Install Agent" })] }, agent.id)); }) })] }));
};
