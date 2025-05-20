"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowNode = void 0;
import react_1 from 'react';
import reactflow_1 from 'reactflow';
import WorkflowContext_1 from '@/contexts/WorkflowContext';
import Badge_1 from '@/components/ui/Badge';
// import Card_1 from '@/components/ui/Card'; // Remove old import
import { Card } from '@the-new-fuse/ui-consolidated'; // Import consolidated Card
import Button_1 from '@/components/ui/Button';
import lucide_react_1 from 'lucide-react';
import DropdownMenu_1 from '@/components/ui/DropdownMenu';
exports.WorkflowNode = (0, react_1.memo)(({ id, data, selected }) => {
    const { actions: { removeNode, updateNode, executeNode }, isReadOnly, } = (0, WorkflowContext_1.useWorkflow)();
    const handleExecute = (0, react_1.useCallback)(() => {
        executeNode(id);
    }, [executeNode, id]);
    const handleRemove = (0, react_1.useCallback)(() => {
        removeNode(id);
    }, [removeNode, id]);
    const handleConfig = (0, react_1.useCallback)(() => {
    }, []);
    const getNodeStyle = () => {
        const baseStyle = {
            padding: '10px',
            borderRadius: '8px',
            minWidth: '150px',
        };
        const typeStyles = {
            agent: {
                backgroundColor: '#818cf8',
                borderColor: '#6366f1',
            },
            tool: {
                backgroundColor: '#34d399',
                borderColor: '#10b981',
            },
            condition: {
                backgroundColor: '#fbbf24',
                borderColor: '#f59e0b',
            },
        };
        const statusStyles = {
            idle: { opacity: 0.8 },
            running: { animation: 'pulse 2s infinite' },
            completed: { opacity: 1 },
            error: { borderColor: '#ef4444' },
        };
        return Object.assign(Object.assign(Object.assign(Object.assign({}, baseStyle), typeStyles[data.type]), (data.status ? statusStyles[data.status] : {})), (selected ? { boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)' } : {}));
    };
    return (<Card className="relative" style={getNodeStyle()}>
      <reactflow_1.Handle type="target" position={reactflow_1.Position.Top} className="w-3 h-3 bg-blue-500"/>
      
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-white">{data.label}</span>
          {data.status && (<Badge_1.Badge variant={data.status === 'completed'
                ? 'success'
                : data.status === 'error'
                    ? 'destructive'
                    : 'secondary'}>
              {data.status}
            </Badge_1.Badge>)}
        </div>

        <DropdownMenu_1.DropdownMenu>
          <DropdownMenu_1.DropdownMenuTrigger asChild>
            <Button_1.Button variant="ghost" className="h-8 w-8 p-0" disabled={isReadOnly}>
              <lucide_react_1.MoreHorizontal className="h-4 w-4"/>
            </Button_1.Button>
          </DropdownMenu_1.DropdownMenuTrigger>
          <DropdownMenu_1.DropdownMenuContent align="end">
            <DropdownMenu_1.DropdownMenuLabel>Actions</DropdownMenu_1.DropdownMenuLabel>
            <DropdownMenu_1.DropdownMenuSeparator />
            <DropdownMenu_1.DropdownMenuItem onClick={handleExecute}>
              <lucide_react_1.Play className="mr-2 h-4 w-4"/>
              Execute
            </DropdownMenu_1.DropdownMenuItem>
            <DropdownMenu_1.DropdownMenuItem onClick={handleConfig}>
              <lucide_react_1.Settings className="mr-2 h-4 w-4"/>
              Configure
            </DropdownMenu_1.DropdownMenuItem>
            <DropdownMenu_1.DropdownMenuSeparator />
            <DropdownMenu_1.DropdownMenuItem onClick={handleRemove} className="text-red-600">
              <lucide_react_1.Trash2 className="mr-2 h-4 w-4"/>
              Remove
            </DropdownMenu_1.DropdownMenuItem>
          </DropdownMenu_1.DropdownMenuContent>
        </DropdownMenu_1.DropdownMenu>
      </div>

      <reactflow_1.Handle type="source" position={reactflow_1.Position.Bottom} className="w-3 h-3 bg-blue-500"/>
    </Card>);
});
export {};
//# sourceMappingURL=WorkflowNode.js.map