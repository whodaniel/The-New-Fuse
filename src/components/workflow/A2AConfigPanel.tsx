import React, { useState } from 'react';
import { Form, Select, Input } from 'antd';
import { useWorkflowContext } from '../../context/WorkflowContext.js';

export const A2AConfigPanel: React.FC<{ nodeId: string }> = ({ nodeId }) => {
    const { updateNodeConfig, getNodeConfig } = useWorkflowContext();
    const [config, setConfig] = useState(getNodeConfig(nodeId));

    const handleChange = (changes: any) => {
        const newConfig = { ...config, ...changes };
        setConfig(newConfig);
        updateNodeConfig(nodeId, newConfig);
    };

    return (
        <Form layout="vertical">
            <Form.Item label="Agent Type">
                <Select
                    value={config.agentType}
                    onChange={value => handleChange({ agentType: value })}
                    options={[
                        { label: 'Task Execution', value: 'TASK_EXECUTION' },
                        { label: 'Data Processing', value: 'DATA_PROCESSING' },
                        { label: 'Coordination', value: 'COORDINATION' }
                    ]}
                />
            </Form.Item>
            <Form.Item label="Protocol Version">
                <Input value={config.protocolVersion} disabled />
            </Form.Item>
            <Form.Item label="Security Level">
                <Select
                    value={config.securityLevel}
                    onChange={value => handleChange({ securityLevel: value })}
                    options={[
                        { label: 'High', value: 'high' },
                        { label: 'Medium', value: 'medium' },
                        { label: 'Low', value: 'low' }
                    ]}
                />
            </Form.Item>
        </Form>
    );
};