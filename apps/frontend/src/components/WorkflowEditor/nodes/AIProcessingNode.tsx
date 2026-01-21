import React, { useCallback } from 'react';
import { Handle, Position } from 'reactflow';

export const AIProcessingNode = ({ data, isConnectable }) => {
  const onParameterChange = useCallback((key, value) => {
    data.parameters[key] = value;
  }, [data]);

  return (
    <div
      className="node-container"
      style={{
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '10px',
        width: '250px',
        // Apply red glow if error exists
        boxShadow: data.error
          ? '0 0 10px red'
          : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
      }}
      // Show error message on hover
      title={data.error}
    >
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />

      <div className="node-header" style={{
        borderBottom: '1px solid #eee',
        marginBottom: '10px',
        paddingBottom: '5px'
      }}>
        <h3 style={{ margin: 0 }}>AI Processing</h3>
      </div>

      <div className="node-content">
        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label>AI Task:</label>
          <select
            value={data.parameters?.aiTask}
            onChange={(e) => onParameterChange('aiTask', e.target.value)}
            style={{
              width: '100%',
              padding: '5px',
              marginTop: '5px'
            }}
          >
            <option value="textAnalysis">Text Analysis</option>
          </select>
        </div>

        <div className="form-group">
          <label>Text Input:</label>
          <textarea
            value={data.parameters?.textInput}
            onChange={(e) => onParameterChange('textInput', e.target.value)}
            placeholder="Enter text to analyze"
            style={{
              width: '100%',
              padding: '5px',
              marginTop: '5px',
              minHeight: '60px'
            }}
          />
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </div>
  );
};
