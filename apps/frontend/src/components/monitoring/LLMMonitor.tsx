import React, { useEffect, useState } from 'react';
import { webSocketService } from '../services/websocket.js';

export const LLMMonitor: React.FC = () => {
    const [llmMetrics, setLLMMetrics] = useState({
        activeRequests: 0,
        recentInteractions: [],
        averageLatency: 0,
        errorRate: 0
    });

    useEffect(() => {
        webSocketService.on('trae:llm-metrics', (data) => {
            setLLMMetrics((prev: any) => ({
                ...prev,
                ...data
            }));
        });

        return () => {
            webSocketService.off('trae:llm-metrics');
        };
    }, []);

    return (
        <div className="llm-monitor p-4">
            <h2 className="text-xl font-bold mb-4">Trae LLM Monitor</h2>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="metric-card">
                    <h3>Active Requests</h3>
                    <p>{llmMetrics.activeRequests}</p>
                </div>
                <div className="metric-card">
                    <h3>Average Latency</h3>
                    <p>{llmMetrics.averageLatency}ms</p>
                </div>
                <div className="metric-card">
                    <h3>Error Rate</h3>
                    <p>{(llmMetrics.errorRate * 100).toFixed(1)}%</p>
                </div>
            </div>

            <div className="mt-4">
                <h3 className="font-bold">Recent Interactions</h3>
                <div className="overflow-auto max-h-60">
                    {llmMetrics.recentInteractions.map((interaction, index) => (
                        <div key={index} className="border-b py-2">
                            <p>Status: {interaction.status}</p>
                            <p>Duration: {interaction.duration}ms</p>
                            <p className="text-sm text-gray-500">
                                {new Date(interaction.timestamp).toLocaleTimeString()}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};