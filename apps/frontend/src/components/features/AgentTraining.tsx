Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentTraining = void 0;
import react_1 from 'react';
import react_query_1 from '@tanstack/react-query';
import Card_1 from '../../../core/Card.js';
import Button_1 from '../../../core/Button.js';
import Input_1 from '../../../core/Input.js';
import Select_1 from '../../../core/Select.js';
import FileUpload_1 from '../../chat/FileUpload.js';
import agentService_1 from '../../../../services/api/agentService.js';
import react_hot_toast_1 from 'react-hot-toast';
import recharts_1 from 'recharts';
const AgentTraining = ({ agentId }) => {
    const [trainingConfig, setTrainingConfig] = (0, react_1.useState)({
        model: 'gpt-4',
        epochs: 10,
        batchSize: 32,
        learningRate: 0.001,
        validationSplit: 0.2,
    });
    const [customData, setCustomData] = (0, react_1.useState)(null);
    const { data: agent } = (0, react_query_1.useQuery)({
        queryKey: ['agent', agentId],
        queryFn: () => agentService_1.agentService.getAgentById(agentId),
    });
    const { data: trainingHistory } = (0, react_query_1.useQuery)({
        queryKey: ['training-history', agentId],
        queryFn: () => agentService_1.agentService.getTrainingHistory(agentId),
        refetchInterval: 5000,
    });
    const trainMutation = (0, react_query_1.useMutation)({
        mutationFn: async () => {
            let customDataPayload;
            if (customData) {
                const reader = new FileReader();
                customDataPayload = await new Promise((resolve) => {
                    reader.onload = (e) => { var _a; return resolve(JSON.parse((_a = e.target) === null || _a === void 0 ? void 0 : _a.result)); };
                    reader.readAsText(customData);
                });
            }
            return agentService_1.agentService.trainAgent(agentId, Object.assign(Object.assign({}, trainingConfig), { customData: customDataPayload }));
        },
        onSuccess: () => {
            react_hot_toast_1.toast.success('Training started successfully');
        },
        onError: (error) => {
            react_hot_toast_1.toast.error('Failed to start training');
            console.error('Training error:', error);
        },
    });
    const validateMutation = (0, react_query_1.useMutation)({
        mutationFn: (testData) => agentService_1.agentService.validateTraining(agentId, testData),
        onSuccess: (data) => {
            react_hot_toast_1.toast.success(`Validation complete - Accuracy: ${(data.accuracy * 100).toFixed(2)}%`);
        },
        onError: (error) => {
            react_hot_toast_1.toast.error('Validation failed');
            console.error('Validation error:', error);
        },
    });
    const handleStartTraining = () => {
        trainMutation.mutate();
    };
    const handleValidateTraining = async () => {
        if (!customData) {
            react_hot_toast_1.toast.error('Please upload test data');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            var _a;
            try {
                const testData = JSON.parse((_a = e.target) === null || _a === void 0 ? void 0 : _a.result);
                validateMutation.mutate(testData);
            }
            catch (error) {
                react_hot_toast_1.toast.error('Invalid test data format');
            }
        };
        reader.readAsText(customData);
    };
    const formatMetrics = (history) => {
        return history.map((item) => ({
            epoch: item.epoch,
            accuracy: item.metrics.accuracy,
            loss: item.metrics.loss,
            validationAccuracy: item.metrics.val_accuracy,
            validationLoss: item.metrics.val_loss,
        }));
    };
    return (<Card_1.Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          Training Configuration - {agent === null || agent === void 0 ? void 0 : agent.name}
        </h2>
        <div className="space-x-2">
          <Button_1.Button variant="outline" onClick={handleValidateTraining} disabled={validateMutation.isPending || !customData}>
            Validate Training
          </Button_1.Button>
          <Button_1.Button onClick={handleStartTraining} disabled={trainMutation.isPending}>
            Start Training
          </Button_1.Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Model</label>
            <Select_1.Select value={trainingConfig.model} onChange={(e) => setTrainingConfig((prev: any) => (Object.assign(Object.assign({}, prev), { model: e.target.value })))}>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="claude-2">Claude 2</option>
              <option value="custom">Custom Model</option>
            </Select_1.Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Epochs</label>
            <Input_1.Input type="number" value={trainingConfig.epochs} onChange={(e) => setTrainingConfig((prev: any) => (Object.assign(Object.assign({}, prev), { epochs: parseInt(e.target.value) })))} min={1} max={100}/>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Batch Size</label>
            <Input_1.Input type="number" value={trainingConfig.batchSize} onChange={(e) => setTrainingConfig((prev: any) => (Object.assign(Object.assign({}, prev), { batchSize: parseInt(e.target.value) })))} min={1} max={512}/>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Learning Rate</label>
            <Input_1.Input type="number" value={trainingConfig.learningRate} onChange={(e) => setTrainingConfig((prev: any) => (Object.assign(Object.assign({}, prev), { learningRate: parseFloat(e.target.value) })))} min={0.0001} max={1} step={0.0001}/>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Validation Split</label>
            <Input_1.Input type="number" value={trainingConfig.validationSplit} onChange={(e) => setTrainingConfig((prev: any) => (Object.assign(Object.assign({}, prev), { validationSplit: parseFloat(e.target.value) })))} min={0.1} max={0.5} step={0.1}/>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Custom Training/Test Data
            </label>
            <FileUpload_1.FileUpload onUploadComplete={(file) => setCustomData(file)} disabled={trainMutation.isPending}/>
            <p className="text-xs text-gray-500 mt-1">
              Upload JSON file containing training or test data
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Training Progress</h3>
          {trainingHistory && trainingHistory.history.length > 0 ? (<div className="space-y-4">
              <div className="h-64">
                <recharts_1.LineChart width={500} height={250} data={formatMetrics(trainingHistory.history)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <recharts_1.CartesianGrid strokeDasharray="3 3"/>
                  <recharts_1.XAxis dataKey="epoch"/>
                  <recharts_1.YAxis />
                  <recharts_1.Tooltip />
                  <recharts_1.Legend />
                  <recharts_1.Line type="monotone" dataKey="accuracy" stroke="#8884d8" name="Accuracy"/>
                  <recharts_1.Line type="monotone" dataKey="loss" stroke="#82ca9d" name="Loss"/>
                  {trainingHistory.history[0].metrics.val_accuracy && (<recharts_1.Line type="monotone" dataKey="validationAccuracy" stroke="#ffc658" name="Validation Accuracy"/>)}
                </recharts_1.LineChart>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card_1.Card className="p-4">
                  <h4 className="text-sm font-medium mb-2">Latest Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Accuracy:</span>
                      <span className="text-sm font-medium">
                        {(trainingHistory.history[trainingHistory.history.length - 1].metrics.accuracy * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Loss:</span>
                      <span className="text-sm font-medium">
                        {trainingHistory.history[trainingHistory.history.length - 1].metrics.loss.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </Card_1.Card>

                <Card_1.Card className="p-4">
                  <h4 className="text-sm font-medium mb-2">Training Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Progress:</span>
                      <span className="text-sm font-medium">
                        {trainingHistory.history.length} / {trainingConfig.epochs} epochs
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Status:</span>
                      <span className="text-sm font-medium text-green-500">
                        {trainMutation.isPending ? 'Training...' : 'Ready'}
                      </span>
                    </div>
                  </div>
                </Card_1.Card>
              </div>
            </div>) : (<div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
              <p className="text-gray-500">No training history available</p>
            </div>)}
        </div>
      </div>
    </Card_1.Card>);
};
exports.AgentTraining = AgentTraining;
exports.default = exports.AgentTraining;
export {};
//# sourceMappingURL=AgentTraining.js.map