import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Progress } from 'antd';
import { Line } from '@ant-design/charts';
import { useWebSocket } from '../../hooks/useWebSocket.js';

export const A2APerformanceDashboard: React.FC = () => {
    const [metrics, setMetrics] = useState<any>({});
    const { messages } = useWebSocket('ws://localhost:3000/metrics');

    const columns = [
        { title: 'Agent ID', dataIndex: 'agentId' },
        { title: 'Response Time', dataIndex: 'responseTime' },
        { title: 'Success Rate', dataIndex: 'successRate' },
        {
            title: 'CPU Usage',
            dataIndex: 'cpuUsage',
            render: (value: number) => <Progress percent={value} size="small" />
        }
    ];

    useEffect(() => {
        if (messages.type === 'metrics_update') {
            setMetrics(messages.data);
        }
    }, [messages]);

    return (
        <Row gutter={[16, 16]}>
            <Col span={24}>
                <Card title="Real-time Performance">
                    <Line
                        data={metrics.timeSeriesData || []}
                        xField="timestamp"
                        yField="value"
                        seriesField="metric"
                    />
                </Card>
            </Col>
            <Col span={24}>
                <Card title="Agent Metrics">
                    <Table
                        dataSource={metrics.agentMetrics || []}
                        columns={columns}
                        pagination={false}
                    />
                </Card>
            </Col>
        </Row>
    );
};