"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowEdge = void 0;
import react_1 from 'react';
import reactflow_1 from 'reactflow';
import WorkflowContext_1 from '@/contexts/WorkflowContext';
import Button_1 from '@/components/ui/Button';
import lucide_react_1 from 'lucide-react';
exports.WorkflowEdge = (0, react_1.memo)(({ id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, style = {}, markerEnd, }) => {
    const { actions: { removeEdge }, isReadOnly } = (0, WorkflowContext_1.useWorkflow)();
    const [edgePath, labelX, labelY] = (0, reactflow_1.getBezierPath)({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });
    const isConditional = (data === null || data === void 0 ? void 0 : data.type) === 'conditional';
    const edgeColor = isConditional ? '#f59e0b' : '#64748b';
    return (<>
      <reactflow_1.BaseEdge path={edgePath} markerEnd={markerEnd} style={Object.assign(Object.assign({}, style), { stroke: edgeColor, strokeWidth: 2, animation: (data === null || data === void 0 ? void 0 : data.animated) ? 'flowAnimation 1s infinite' : undefined })}/>

      {(data === null || data === void 0 ? void 0 : data.label) && (<reactflow_1.EdgeLabelRenderer>
          <div style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                fontSize: 12,
                pointerEvents: 'all',
            }} className="nodrag nopan">
            <div className={`px-2 py-1 rounded-md ${isConditional ? 'bg-amber-100' : 'bg-slate-100'}`}>
              {data.label}
            </div>
          </div>
        </reactflow_1.EdgeLabelRenderer>)}

      {!isReadOnly && (<reactflow_1.EdgeLabelRenderer>
          <div style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                pointerEvents: 'all',
            }} className="nodrag nopan">
            <Button_1.Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 hover:opacity-100 transition-opacity" onClick={() => removeEdge(id)}>
              <lucide_react_1.X className="h-4 w-4"/>
            </Button_1.Button>
          </div>
        </reactflow_1.EdgeLabelRenderer>)}
    </>);
});
exports.WorkflowEdge.displayName = 'WorkflowEdge';
export {};
//# sourceMappingURL=WorkflowEdge.js.map