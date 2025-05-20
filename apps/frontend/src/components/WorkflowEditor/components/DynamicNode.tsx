import React, { useEffect, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { NodeConfigBuilder } from '../utils/node-config-builder.js';
import { CodeEditor } from './CodeEditor.js';
import { CollectionEditor } from './CollectionEditor.js';
import { CredentialSelector } from './CredentialSelector.js';
export const DynamicNode = ({ data, id, isConnectable, }) => {
    var _a;
    const [nodeSchema, setNodeSchema] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchNodeSchema = async () => {
            try {
                const response = await fetch(`/api/n8n/node-types/${data.type}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch node schema');
                }
                const schema = await response.json();
                setNodeSchema(NodeConfigBuilder.createConfig(schema));
                setLoading(false);
            }
            catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        fetchNodeSchema();
    }, [data.type]);
    if (loading) {
        return (<div className="dynamic-node loading">
        <div className="node-content">Loading...</div>
      </div>);
    }
    if (error || !nodeSchema) {
        return (<div className="dynamic-node error">
        <div className="node-content">Error: {error || 'Failed to load node'}</div>
      </div>);
    }
    const renderParamInput = (param, value, onChange) => {
        switch (param.type) {
            case 'string':
                return (<input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={param.placeholder} className="param-input"/>);
            case 'number':
                return (<input type="number" value={value || ''} onChange={(e) => onChange(Number(e.target.value))} placeholder={param.placeholder} className="param-input"/>);
            case 'boolean':
                return (<input type="checkbox" checked={value || false} onChange={(e) => onChange(e.target.checked)} className="param-checkbox"/>);
            case 'options':
                return (<select value={value || param.default} onChange={(e) => onChange(e.target.value)} className="param-select">
            {param.options.map((opt) => (<option key={opt.value} value={opt.value}>
                {opt.name}
              </option>))}
          </select>);
            case 'json':
                return (<CodeEditor value={value || {}} onChange={onChange} language="json"/>);
            case 'collection':
                return (<CollectionEditor items={value || []} schema={param} onChange={onChange}/>);
            default:
                return (<input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={param.placeholder} className="param-input"/>);
        }
    };
    const updateNodeData = (paramName, value) => {
        const newParameters = Object.assign(Object.assign({}, data.parameters), { [paramName]: value });
    };
    return (<div className="dynamic-node">
      {nodeSchema.inputs.map((input, index) => (<Handle key={`input-${index}`} type="target" position={Position.Top} id={`input-${input.name || 'main'}`} style={{ left: `${(index + 1) * (100 / (nodeSchema.inputs.length + 1))}%` }} isConnectable={isConnectable}/>))}

      <div className="node-header">
        <h4>{nodeSchema.name}</h4>
      </div>

      <div className="node-content">
        {Object.entries(nodeSchema.parameters).map(([paramName, paramConfig]) => (<div key={paramName} className="param-group">
            <label className="param-label">
              {paramConfig.displayName || paramName}
              {paramConfig.required && <span className="required">*</span>}
            </label>
            {renderParamInput(paramConfig, data.parameters[paramName], (value) => updateNodeData(paramName, value))}
            {paramConfig.description && (<div className="param-description">{paramConfig.description}</div>)}
          </div>))}

        {nodeSchema.credentials.length > 0 && (<CredentialSelector credentialType={nodeSchema.credentials[0].name} value={(_a = data.credentials) === null || _a === void 0 ? void 0 : _a.id} onChange={(credId) => {
            }}/>)}
      </div>

      {nodeSchema.outputs.map((output, index) => (<Handle key={`output-${index}`} type="source" position={Position.Bottom} id={`output-${output.name || 'main'}`} style={{ left: `${(index + 1) * (100 / (nodeSchema.outputs.length + 1))}%` }} isConnectable={isConnectable}/>))}
    </div>);
};
//# sourceMappingURL=DynamicNode.js.map