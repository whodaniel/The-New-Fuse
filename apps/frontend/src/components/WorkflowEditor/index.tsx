import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { Controls, Background, addEdge, useNodesState, useEdgesState, ReactFlowProvider, } from 'reactflow';
import 'reactflow/dist/style.css';
import '@reactflow/node-resizer/dist/style.css';
import './styles/WorkflowEditor.css';
import { DynamicNode } from './components/DynamicNode.js';
import n8nMetadataService from '../services/n8n-metadata.service.js';
import { convertReactFlowToN8n } from './utils/converter.js';
import { validateN8nWorkflow, createDynamicValidator } from './utils/validation.js';
import { WorkflowValidator } from './utils/realtime-validation.js';
import { processErrorConnections } from './utils/special-nodes.js';
import { getNodeCategoryFromMetadata } from './utils/node-support.js';
const nodeTypes = {
    dynamicNode: DynamicNode,
};
export function WorkflowEditor() {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [nodeTypesMetadata, setNodeTypesMetadata] = useState({});
    const [dynamicNodeValidators, setDynamicNodeValidators] = useState(null);
    const [validationErrors, setValidationErrors] = useState([]);
    const [workflowName, setWorkflowName] = useState('My Workflow');
    useEffect(() => {
        const fetchNodeTypes = async () => {
            try {
                const typesData = await n8nMetadataService.getAllNodeTypes();
                const metadataMap = {};
                typesData.forEach(typeData => {
                    metadataMap[typeData.name] = typeData;
                });
                setNodeTypesMetadata(metadataMap);
                setDynamicNodeValidators(() => createDynamicValidator(typesData));
            }
            catch (error) {
                console.error("Failed to load node types metadata:", error);
            }
        };
        fetchNodeTypes();
    }, []);
    useEffect(() => {
        if (dynamicNodeValidators) {
            const validator = new WorkflowValidator(Object.values(nodeTypesMetadata));
            const errors = validator.validate(nodes, edges);
            setValidationErrors(errors);
        }
    }, [nodes, edges, nodeTypesMetadata, dynamicNodeValidators]);
    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);
    const onNodeDragStop = useCallback((event, node) => {
        setNodes((nds) => nds.map(n => {
            if (n.id === node.id) {
                return Object.assign(Object.assign({}, n), { position: node.position });
            }
            return n;
        }));
    }, [setNodes]);
    const onAddNode = useCallback(async (nodeType) => {
        if (!nodeTypesMetadata[nodeType]) {
            console.error(`Metadata not found for node type: ${nodeType}`);
            return;
        }
        const newNode = {
            id: `${nodeType}_${Date.now()}`,
            type: 'dynamicNode',
            position: { x: 250, y: 250 },
            data: { type: nodeType, name: nodeTypesMetadata[nodeType].displayName, parameters: {} },
        };
        setNodes((nds) => [...nds, newNode]);
    }, [nodeTypesMetadata, setNodes]);
    const handleSaveWorkflow = useCallback(async () => {
        if (!dynamicNodeValidators) {
            alert("Node metadata loading is still in progress. Please wait and try again.");
            return;
        }
        const validator = new WorkflowValidator(Object.values(nodeTypesMetadata));
        const currentValidationErrors = validator.validate(nodes, edges);
        if (currentValidationErrors.length > 0) {
            alert("Workflow has validation errors:\n" + currentValidationErrors.join("\n"));
            setValidationErrors(currentValidationErrors);
            return;
        }
        const n8nWorkflowJson = convertReactFlowToN8n(nodes, edges, nodeTypesMetadata);
        const connectionsWithErrorOutputs = {};
        processErrorConnections(edges, connectionsWithErrorOutputs, nodes);
        Object.keys(connectionsWithErrorOutputs).forEach(sourceNodeId => {
            if (connectionsWithErrorOutputs[sourceNodeId].error) {
                n8nWorkflowJson.connections[sourceNodeId] = n8nWorkflowJson.connections[sourceNodeId] || {};
                n8nWorkflowJson.connections[sourceNodeId].error = connectionsWithErrorOutputs[sourceNodeId].error;
            }
        });
        const validationResult = validateN8nWorkflow(n8nWorkflowJson, dynamicNodeValidators);
        if (!validationResult.success) {
            console.error("n8n Workflow Validation Error:", validationResult.error);
            alert("Error converting workflow to n8n format. See console for details.");
            return;
        }
        try {
            const response = await fetch('/api/n8n/workflow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.assign(Object.assign({}, n8nWorkflowJson), { name: workflowName })),
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error("Failed to save workflow:", errorData);
                alert(`Failed to save workflow: ${errorData.message || 'Unknown error'}`);
            }
            else {
                const result = await response.json();
                alert(`Workflow saved successfully! Workflow ID: ${result.id}`);
            }
        }
        catch (error) {
            console.error("Error saving workflow:", error);
            alert("Error saving workflow. Check console for details.");
        }
    }, [nodes, edges, nodeTypesMetadata, dynamicNodeValidators, workflowName]);
    const nodeCategories = ['trigger', 'input', 'output', 'action', 'utility', 'advanced', 'transform', 'integration', 'flow'];
    const sortedNodeTypes = Object.entries(nodeTypesMetadata)
        .sort(([, a], [, b]) => a.displayName.localeCompare(b.displayName));
    return (<div className="workflow-editor-container">
      <div className="sidebar">
        <h2>Nodes</h2>
        <div className="node-categories">
          {nodeCategories.map(categoryKey => (<div key={categoryKey} className="category-section">
              <h3>{categoryKey.toUpperCase()} Nodes</h3>
              <div className="node-list">
                {sortedNodeTypes
                .filter(([, metadata]) => getNodeCategoryFromMetadata(metadata) === categoryKey)
                .map(([nodeTypeName, metadata]) => (<button key={nodeTypeName} className="node-button" onClick={() => onAddNode(nodeTypeName)}>
                      {metadata.displayName}
                    </button>))}
              </div>
            </div>))}
        </div>
      </div>

      <div className="react-flow-wrapper">
        <input type="text" className="workflow-name-input" placeholder="Workflow Name" value={workflowName} onChange={(e) => setWorkflowName(e.target.value)}/>

        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} nodeTypes={nodeTypes} onNodeDragStop={onNodeDragStop} fitView>
          <Background />
          <Controls />
        </ReactFlow>

        <div className="validation-errors">
          {validationErrors.map((error, index) => (<div key={index} className="error-message">{error}</div>))}
        </div>

        <button className="save-button" onClick={handleSaveWorkflow}>
          Save Workflow
        </button>
      </div>
    </div>);
}
export default function WorkflowEditorWrapper() {
    return (<ReactFlowProvider>
      <WorkflowEditor />
    </ReactFlowProvider>);
}
//# sourceMappingURL=index.js.map