import React, { useCallback } from 'react';
import { Handle, Position } from 'reactflow';
export const slackNode = ({ data, isConnectable }) => {
    const onParameterChange = useCallback((key, value) => {
        data.parameters[key] = value;
    }, [data]);
    return (<div className="node-container" style={{
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '10px',
            width: '250px'
        }}>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable}/>
      
      <div className="node-header" style={{
            borderBottom: '1px solid #eee',
            marginBottom: '10px',
            paddingBottom: '5px'
        }}>
        <h3 style={{ margin: 0 }}>Slack</h3>
      </div>

      <div className="node-content">
        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label>Channel:</label>
          <input type="text" value={data.parameters.channel} onChange={(e) => onParameterChange('channel', e.target.value)} placeholder="#channel or @username" style={{
            width: '100%',
            padding: '5px',
            marginTop: '5px'
        }}/>
        </div>

        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label>Message:</label>
          <textarea value={data.parameters.text} onChange={(e) => onParameterChange('text', e.target.value)} placeholder="Message text with optional {{ $json }} variables" style={{
            width: '100%',
            padding: '5px',
            marginTop: '5px',
            minHeight: '60px'
        }}/>
        </div>

        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label>Blocks (JSON):</label>
          <textarea value={data.parameters.blocks} onChange={(e) => onParameterChange('blocks', e.target.value)} placeholder='[{"type": "section", "text": {"type": "mrkdwn", "text": "Hello"}}]' style={{
            width: '100%',
            padding: '5px',
            marginTop: '5px',
            minHeight: '60px'
        }}/>
        </div>

        <div className="form-group">
          <label>Thread Timestamp:</label>
          <input type="text" value={data.parameters.threadTs} onChange={(e) => onParameterChange('threadTs', e.target.value)} placeholder="Optional thread timestamp" style={{
            width: '100%',
            padding: '5px',
            marginTop: '5px'
        }}/>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable}/>
    </div>);
};
//# sourceMappingURL=SlackNode.js.map