"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Dashboard;
import react_1 from 'react';
import route_context_1 from '../contexts/route-context.js';
import card_1 from '../components/ui/card.js';
import components_1 from '../components.js';
function Dashboard() {
    const { setPageTitle } = (0, route_context_1.useRoute)();
    (0, react_1.useEffect)(() => {
        setPageTitle('Dashboard');
    }, [setPageTitle]);
    return (<div className="grid gap-6">
      
      <card_1.Card className="p-6">
        <components_1.AgentCollaborationDashboard />
      </card_1.Card>

      <div className="grid gap-6 md:grid-cols-2">
        <card_1.Card className="p-6">
          <components_1.SystemMetrics />
        </card_1.Card>
        <card_1.Card className="p-6">
          <components_1.PerformanceMetrics />
        </card_1.Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <card_1.Card className="p-6 md:col-span-2">
          <components_1.TaskBoard />
        </card_1.Card>
        <card_1.Card className="p-6">
          <components_1.AgentNetwork />
        </card_1.Card>
      </div>
    </div>);
}
export {};
//# sourceMappingURL=Dashboard.js.map