"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictiveTaskAllocator = PredictiveTaskAllocator;
import react_1 from 'react';
import button_1 from '@/components/ui/button';
import card_1 from '@/components/ui/card';
import table_1 from '@/components/ui/table';
import websocket_1 from '../services/websocket.js';
function PredictiveTaskAllocator() {
    const [tasks, setTasks] = (0, react_1.useState)([]);
    const [agents, setAgents] = (0, react_1.useState)([]);
    const [allocations, setAllocations] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        websocket_1.webSocketService.on('tasksUpdate', setTasks);
        websocket_1.webSocketService.on('agentsUpdate', setAgents);
        websocket_1.webSocketService.on('allocationsUpdate', setAllocations);
        return () => {
            websocket_1.webSocketService.off('tasksUpdate', setTasks);
            websocket_1.webSocketService.off('agentsUpdate', setAgents);
            websocket_1.webSocketService.off('allocationsUpdate', setAllocations);
        };
    }, []);
    const handleAllocate = () => {
        websocket_1.webSocketService.send('allocateTasks', {});
    };
    return (<card_1.Card className="w-full max-w-4xl">
      <card_1.CardHeader>
        <card_1.CardTitle>Predictive Task Allocator</card_1.CardTitle>
      </card_1.CardHeader>
      <card_1.CardContent>
        <table_1.Table>
          <table_1.TableHeader>
            <table_1.TableRow>
              <table_1.TableHead>Task</table_1.TableHead>
              <table_1.TableHead>Predicted Agent</table_1.TableHead>
              <table_1.TableHead>Confidence</table_1.TableHead>
            </table_1.TableRow>
          </table_1.TableHeader>
          <table_1.TableBody>
            {allocations.map((allocation, index) => {
            var _a, _b;
            return (<table_1.TableRow key={index}>
                <table_1.TableCell>{(_a = tasks.find(t => t.id === allocation.taskId)) === null || _a === void 0 ? void 0 : _a.name}</table_1.TableCell>
                <table_1.TableCell>{(_b = agents.find(a => a.id === allocation.agentId)) === null || _b === void 0 ? void 0 : _b.name}</table_1.TableCell>
                <table_1.TableCell>{`${(allocation.confidence * 100).toFixed(2)}%`}</table_1.TableCell>
              </table_1.TableRow>);
        })}
          </table_1.TableBody>
        </table_1.Table>
        <button_1.Button onClick={handleAllocate} className="mt-4 w-full">Allocate Tasks</button_1.Button>
      </card_1.CardContent>
    </card_1.Card>);
}
export {};
//# sourceMappingURL=predictive-task-allocator.js.map