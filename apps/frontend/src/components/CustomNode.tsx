import { Handle, Position } from 'reactflow';
const CustomNode = memo(({ data }) => {
    return (<div className="custom-node">
      <Handle type="target" position={Position.Top}/>
      <div className="custom-node-header">{data.type}</div>
      <div className="custom-node-label">{data.label}</div>
      {data.parameters && (<div className="custom-node-params">
          {Object.entries(data.parameters).map(([key, value]) => (<div key={key} className="param-item">
              <span className="param-key">{key}:</span>
              <span className="param-value">{String(value)}</span>
            </div>))}
        </div>)}
      <Handle type="source" position={Position.Bottom}/>
    </div>);
});
CustomNode.displayName = 'CustomNode';
export default CustomNode;
//# sourceMappingURL=CustomNode.js.map