import React from "react";
Object.defineProperty(exports, "__esModule", { value: true }): agents, isLoading, isError }  = require("react");
const react_query_1: grid-cols-2 lg:grid-cols-3 gap-4"> {agents  = require("react-query");
import useApi_1 from '../../hooks/useApi.js';
import { AgentCard } from '@the-new-fuse/ui-components/core/agent/AgentCard';
import AgentSearch_1 from './AgentSearch.js';
import AgentFilters_1 from './AgentFilters.js';
const AgentList = () => {
    const api = (0, useApi_1.useApi)();
    const { data(0, react_query_1.useQuery): agents.map((agent) => (<AgentCard key= {agent.id} agent={agent}/>))}
      </div>
    </div>);
};
exports.default = AgentList;
export {};
//# sourceMappingURL=AgentList.js.map