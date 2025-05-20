Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentCollaboration = void 0;
import react_1 from 'react';
import react_query_1 from '@tanstack/react-query';
import Card_1 from '../../../core/Card.js';
import Button_1 from '../../../core/Button.js';
import Select_1 from '../../../core/Select.js';
import agentService_1 from '../../../../services/api/agentService.js';
import websocket_1 from '../../../../services/websocket.js';
import react_hot_toast_1 from 'react-hot-toast';
const AgentCollaboration = () => {
    const [selectedAgents, setSelectedAgents] = (0, react_1.useState)([]);
    const [collaboratingAgents, setCollaboratingAgents] = (0, react_1.useState)([]);
    const [isCollaborating, setIsCollaborating] = (0, react_1.useState)(false);
    const { data: agents = [] } = (0, react_query_1.useQuery)({
        queryKey: ['agents'],
        queryFn: agentService_1.agentService.getAllAgents,
    });
    const startCollaborationMutation = (0, react_query_1.useMutation)({
        mutationFn: async (agentIds) => {
            const response = await agentService_1.agentService.startCollaboration(agentIds);
            return response;
        },
        onSuccess: (data) => {
            setIsCollaborating(true);
            react_hot_toast_1.toast.success('Collaboration started successfully');
            websocket_1.default.sendMessage({
                type: 'agent_action',
                payload: {
                    action: 'collaboration_started',
                    agents: data.agents,
                },
                sender: {
                    id: 'system',
                    type: 'system',
                    name: 'System',
                },
            });
        },
        onError: (error) => {
            react_hot_toast_1.toast.error('Failed to start collaboration');
            console.error('Collaboration error:', error);
        },
    });
    const stopCollaborationMutation = (0, react_query_1.useMutation)({
        mutationFn: async () => {
            const response = await agentService_1.agentService.stopCollaboration();
            return response;
        },
        onSuccess: () => {
            setIsCollaborating(false);
            setCollaboratingAgents([]);
            react_hot_toast_1.toast.success('Collaboration stopped');
        },
        onError: (error) => {
            react_hot_toast_1.toast.error('Failed to stop collaboration');
            console.error('Stop collaboration error:', error);
        },
    });
    (0, react_1.useEffect)(() => {
        const unsubscribe = websocket_1.default.onMessage((message) => {
            if (message.type === 'agent_action') {
                switch (message.payload.action) {
                    case 'agent_joined_collaboration':
                        setCollaboratingAgents((prev: any) => [...prev, message.payload.agent]);
                        react_hot_toast_1.toast.success(`${message.payload.agent.name} joined the collaboration`);
                        break;
                    case 'agent_left_collaboration':
                        setCollaboratingAgents((prev: any) => prev.filter(agent => agent.id !== message.payload.agentId));
                        react_hot_toast_1.toast.info(`An agent left the collaboration`);
                        break;
                    case 'collaboration_progress':
                        react_hot_toast_1.toast.success(message.payload.message);
                        break;
                }
            }
        });
        return unsubscribe;
    }, []);
    const handleStartCollaboration = async () => {
        if (selectedAgents.length < 2) {
            react_hot_toast_1.toast.error('Please select at least 2 agents');
            return;
        }
        startCollaborationMutation.mutate(selectedAgents);
    };
    const handleStopCollaboration = async () => {
        if (window.confirm('Are you sure you want to stop the collaboration?')) {
            stopCollaborationMutation.mutate();
        }
    };
    return (<Card_1.Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Agent Collaboration</h2>
        {isCollaborating ? (<Button_1.Button variant="destructive" onClick={handleStopCollaboration} disabled={stopCollaborationMutation.isPending}>
            Stop Collaboration
          </Button_1.Button>) : (<Button_1.Button onClick={handleStartCollaboration} disabled={startCollaborationMutation.isPending ||
                selectedAgents.length < 2}>
            Start Collaboration
          </Button_1.Button>)}
      </div>

      {!isCollaborating && (<div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Select Agents to Collaborate
          </label>
          <Select_1.Select multiple value={selectedAgents} onChange={(e) => {
                const options = e.target;
                const values = Array.from(options.selectedOptions).map(option => option.value);
                setSelectedAgents(values);
            }} className="w-full">
            {agents.map((agent) => (<option key={agent.id} value={agent.id}>
                {agent.name} ({agent.type})
              </option>))}
          </Select_1.Select>
          <p className="text-sm text-gray-500 mt-1">
            Select at least 2 agents to start collaboration
          </p>
        </div>)}

      {isCollaborating && collaboratingAgents.length > 0 && (<div className="space-y-4">
          <h3 className="text-lg font-medium">Active Collaboration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {collaboratingAgents.map((agent) => (<Card_1.Card key={agent.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{agent.name}</h4>
                    <p className="text-sm text-gray-500">{agent.type}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${agent.status === 'active' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'}`}>
                    {agent.status}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-xs font-medium px-2 py-1 bg-primary/10 rounded-full">
                    {agent.role === 'leader' ? '👑 Leader' : '👤 Member'}
                  </span>
                </div>
              </Card_1.Card>))}
          </div>
        </div>)}
    </Card_1.Card>);
};
exports.AgentCollaboration = AgentCollaboration;
exports.default = exports.AgentCollaboration;
export {};
//# sourceMappingURL=AgentCollaboration.js.map