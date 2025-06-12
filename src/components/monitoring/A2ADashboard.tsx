import React, { useEffect, useState } from 'react';
import { Layout, Card, Row, Col } from 'antd';
import { AgentPerformanceMonitor } from './AgentPerformanceMonitor.tsx';
import { A2AMonitor } from './A2AMonitor.tsx';
import { useWebSocket } from '../../hooks/useWebSocket.tsx';

export const A2ADashboard: React.FC<{ workflowId: string }> = ({ workflowId }) => {
    const [agents, setAgents] = useState<string[]>([]);
    const { messages } = useWebSocket(`ws://localhost:3000/workflow/${workflowId}`);

    useEffect(() => {
        if (messages.type === 'agents_update') {
            setAgents(messages.agents);
        }
    }, [messages]);

    return (
        <Layout>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <A2AMonitor workflowId={workflowId} />
                </Col>
                {agents.map(agentId => (
                    <Col span={12} key={agentId}>
                        <AgentPerformanceMonitor agentId={agentId} />
                    </Col>
                ))}
            </Row>
        </Layout>
    );
}