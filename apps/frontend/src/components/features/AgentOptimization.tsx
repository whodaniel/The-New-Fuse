Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentOptimization = void 0;
import react_1 from 'react';
import react_query_1 from '@tanstack/react-query';
import Card_1 from '../../../core/Card.js';
import Button_1 from '../../../core/Button.js';
import Select_1 from '../../../core/Select.js';
import Input_1 from '../../../core/Input.js';
import agentService_1 from '../../../../services/api/agentService.js';
import react_hot_toast_1 from 'react-hot-toast';
import recharts_1 from 'recharts';
const AgentOptimization = ({ agentId }) => {
    var _a, _b, _c, _d;
    const [optimizationConfig, setOptimizationConfig] = (0, react_1.useState)({
        target: 'accuracy',
        constraints: {
            maxLatency: 1000,
            minAccuracy: 0.9,
            maxMemory: 1024,
            maxCost: 0.1,
        },
    });
    const { data: metrics } = (0, react_query_1.useQuery)({
        queryKey: ['agent-metrics', agentId],
        queryFn: () => agentService_1.agentService.getAgentMetrics(agentId),
        refetchInterval: 30000,
    });
    const optimizeMutation = (0, react_query_1.useMutation)({
        mutationFn: () => agentService_1.agentService.optimizeAgent(agentId, optimizationConfig),
        onSuccess: (data) => {
            react_hot_toast_1.toast.success('Optimization completed successfully');
            
        },
        onError: (error) => {
            react_hot_toast_1.toast.error('Optimization failed');
            console.error('Optimization error:', error);
        },
    });
    const handleStartOptimization = () => {
        optimizeMutation.mutate();
    };
    const formatMetricsForChart = (metrics) => {
        var _a, _b, _c, _d;
        if (!metrics)
            return [];
        return [
            {
                name: 'Response Time',
                value: metrics.averageResponseTime,
                target: (_a = optimizationConfig.constraints) === null || _a === void 0 ? void 0 : _a.maxLatency,
            },
            {
                name: 'Accuracy',
                value: metrics.accuracy * 100,
                target: ((_b = optimizationConfig.constraints) === null || _b === void 0 ? void 0 : _b.minAccuracy) ? optimizationConfig.constraints.minAccuracy * 100 : undefined,
            },
            {
                name: 'Memory Usage',
                value: metrics.memoryUsage,
                target: (_c = optimizationConfig.constraints) === null || _c === void 0 ? void 0 : _c.maxMemory,
            },
            {
                name: 'Cost per Request',
                value: metrics.costPerRequest,
                target: (_d = optimizationConfig.constraints) === null || _d === void 0 ? void 0 : _d.maxCost,
            },
        ];
    };
    return (<Card_1.Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Agent Optimization</h2>
        <Button_1.Button onClick={handleStartOptimization} disabled={optimizeMutation.isPending}>
          Start Optimization
        </Button_1.Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Optimization Target
            </label>
            <Select_1.Select value={optimizationConfig.target} onChange={(e) => setOptimizationConfig((prev: any) => (Object.assign(Object.assign({}, prev), { target: e.target.value })))}>
              <option value="speed">Speed</option>
              <option value="accuracy">Accuracy</option>
              <option value="efficiency">Efficiency</option>
            </Select_1.Select>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Constraints</h3>
            
            <div>
              <label className="block text-sm mb-1">Max Latency (ms)</label>
              <Input_1.Input type="number" value={(_a = optimizationConfig.constraints) === null || _a === void 0 ? void 0 : _a.maxLatency} onChange={(e) => setOptimizationConfig((prev: any) => (Object.assign(Object.assign({}, prev), { constraints: Object.assign(Object.assign({}, prev.constraints), { maxLatency: parseInt(e.target.value) }) })))} min={100} max={5000}/>
            </div>

            <div>
              <label className="block text-sm mb-1">Min Accuracy (%)</label>
              <Input_1.Input type="number" value={((_b = optimizationConfig.constraints) === null || _b === void 0 ? void 0 : _b.minAccuracy) ? optimizationConfig.constraints.minAccuracy * 100 : ''} onChange={(e) => setOptimizationConfig((prev: any) => (Object.assign(Object.assign({}, prev), { constraints: Object.assign(Object.assign({}, prev.constraints), { minAccuracy: parseInt(e.target.value) / 100 }) })))} min={50} max={100}/>
            </div>

            <div>
              <label className="block text-sm mb-1">Max Memory (MB)</label>
              <Input_1.Input type="number" value={(_c = optimizationConfig.constraints) === null || _c === void 0 ? void 0 : _c.maxMemory} onChange={(e) => setOptimizationConfig((prev: any) => (Object.assign(Object.assign({}, prev), { constraints: Object.assign(Object.assign({}, prev.constraints), { maxMemory: parseInt(e.target.value) }) })))} min={128} max={4096}/>
            </div>

            <div>
              <label className="block text-sm mb-1">Max Cost per Request ($)</label>
              <Input_1.Input type="number" value={(_d = optimizationConfig.constraints) === null || _d === void 0 ? void 0 : _d.maxCost} onChange={(e) => setOptimizationConfig((prev: any) => (Object.assign(Object.assign({}, prev), { constraints: Object.assign(Object.assign({}, prev.constraints), { maxCost: parseFloat(e.target.value) }) })))} min={0.01} max={1} step={0.01}/>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Performance Metrics</h3>
          {metrics ? (<>
              <div className="h-64">
                <recharts_1.ResponsiveContainer width="100%" height="100%">
                  <recharts_1.BarChart data={formatMetricsForChart(metrics)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <recharts_1.CartesianGrid strokeDasharray="3 3"/>
                    <recharts_1.XAxis dataKey="name"/>
                    <recharts_1.YAxis />
                    <recharts_1.Tooltip />
                    <recharts_1.Legend />
                    <recharts_1.Bar dataKey="value" fill="#8884d8" name="Current"/>
                    <recharts_1.Bar dataKey="target" fill="#82ca9d" name="Target"/>
                  </recharts_1.BarChart>
                </recharts_1.ResponsiveContainer>
              </div>

              {optimizeMutation.data && (<Card_1.Card className="p-4">
                  <h4 className="text-sm font-medium mb-2">Optimization Results</h4>
                  <div className="space-y-2">
                    {Object.entries(optimizeMutation.data.improvements).map(([key, value]) => (<div key={key} className="flex justify-between">
                        <span className="text-sm">{key}:</span>
                        <span className="text-sm font-medium">
                          {typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : value}
                        </span>
                      </div>))}
                  </div>

                  {optimizeMutation.data.recommendations.length > 0 && (<div className="mt-4">
                      <h5 className="text-sm font-medium mb-2">Recommendations</h5>
                      <ul className="list-disc list-inside space-y-1">
                        {optimizeMutation.data.recommendations.map((rec, index) => (<li key={index} className="text-sm">{rec}</li>))}
                      </ul>
                    </div>)}
                </Card_1.Card>)}
            </>) : (<div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
              <p className="text-gray-500">No metrics available</p>
            </div>)}
        </div>
      </div>
    </Card_1.Card>);
};
exports.AgentOptimization = AgentOptimization;
exports.default = exports.AgentOptimization;
export {};
//# sourceMappingURL=AgentOptimization.js.map