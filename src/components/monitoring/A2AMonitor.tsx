import React, { useEffect, useState } from 'react';
import { Card, Table, Badge } from 'antd';
import { useWorkflowContext } from '../../context/WorkflowContext.js';

export const A2AMonitor: React.FC<{ workflowId: string }> = ({ workflowId }) => {
    const [agents, setAgents] = useState<any[]>([]);
    const { getWorkflowNodes } = useWorkflowContext();

    useEffect(() => {
        const nodes = getWorkflowNodes(workflowId).filter(n => n.type === 'A2A_AGENT');
        setAgents(nodes.map(n => ({
            id: n.id,
            type: n.config.agentType,
            status: n.status,
            lastActive: n.lastActive
        })));
    }, [workflowId]);

    const columns = [
        { title: 'Agent ID', dataIndex: 'id' },
        { title: 'Type', dataIndex: 'type' },
        { 
            title: 'Status', 
            dataIndex: 'status',
            render: (status: string) => (
                <Badge 
                    status={status === 'active' ? 'success' : 'default'} 
                    text={status} 
                />
            )
        },
        { title: 'Last Active', dataIndex: 'lastActive' }
    ];

    return (
        <Card title="A2A Agents Monitor">
            <Table 
                dataSource={agents} 
                columns={columns} 
                rowKey="id"
                pagination={false}
            />
        </Card>
    );
};