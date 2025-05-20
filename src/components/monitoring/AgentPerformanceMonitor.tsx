import React, { useEffect, useState } from 'react';
import { Card, Statistic, Row, Col, Progress } from 'antd';
import { AgentMetricsService } from '../../services/AgentMetricsService.js';
import { AgentWebSocketService } from '../../services/AgentWebSocketService.js';

export const AgentPerformanceMonitor: React.FC<{ agentId: string }> = ({ agentId }) => {
    const [metrics, setMetrics] = useState<any>({});
    const [status, setStatus] = useState<string>('idle');
    
    useEffect(() => {
        const socket = new WebSocket(`ws://localhost:3000?agentId=${agentId}`);
        
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'metrics') {
                setMetrics(data.metrics);
            } else if (data.type === 'status') {
                setStatus(data.status);
            }
        };

        return () => socket.close();
    }, [agentId]);

    return (
        <Card title="Agent Performance">
            <Row gutter={16}>
                <Col span={8}>
                    <Statistic title="Response Time" value={metrics.responseTime} suffix="ms" />
                </Col>
                <Col span={8}>
                    <Statistic title="Success Rate" value={metrics.successRate} suffix="%" />
                </Col>
                <Col span={8}>
                    <Progress type="circle" percent={metrics.cpuUsage} title="CPU Usage" />
                </Col>
            </Row>
        </Card>
    );
}