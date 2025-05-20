import React, { useCallback } from 'react';
import { Handle, Position } from 'reactflow';
export const httpRequestNode = ({ data, isConnectable }) => {
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
        <h3 style={{ margin: 0 }}>HTTP Request</h3>
      </div>

      <div className="node-content">
        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label>Method:</label>
          <select value={data.parameters.method} onChange={(e) => onParameterChange('method', e.target.value)} style={{
            width: '100%',
            padding: '5px',
            marginTop: '5px'
        }}>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label>URL:</label>
          <input type="text" value={data.parameters.url} onChange={(e) => onParameterChange('url', e.target.value)} placeholder="https://api.example.com" style={{
            width: '100%',
            padding: '5px',
            marginTop: '5px'
        }}/>
        </div>

        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label>Headers (JSON):</label>
          <textarea value={data.parameters.headers ? JSON.stringify(data.parameters.headers, null, 2) : ''} onChange={(e) => {
            try {
                const headers = JSON.parse(e.target.value);
                onParameterChange('headers', headers);
            }
            catch (error) {
            }
        }} placeholder='{"Content-Type": "application/json"}' style={{
            width: '100%',
            padding: '5px',
            marginTop: '5px',
            minHeight: '60px'
        }}/>
        </div>

        <div className="form-group">
          <label>Body (JSON):</label>
          <textarea value={data.parameters.body} onChange={(e) => onParameterChange('body', e.target.value)} placeholder='{"key": "value"}' style={{
            width: '100%',
            padding: '5px',
            marginTop: '5px',
            minHeight: '60px'
        }}/>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable}/>
    </div>);
};
//# sourceMappingURL=HttpRequestNode.js.map