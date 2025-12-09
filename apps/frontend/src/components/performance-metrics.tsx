'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { webSocketService } from '../services/websocket';

interface PerformanceData {
    timestamp: number;
    cpuUsage: number;
    memoryUsage: number;
    activeAgents: number;
}

export function PerformanceMetrics() {
    const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);

    useEffect(() => {
        const handlePerformanceUpdate = (data: PerformanceData) => {
            setPerformanceData(prevData => [...prevData.slice(-19), data]);
        };
        webSocketService.on('performanceUpdate', handlePerformanceUpdate);
        return () => {
            webSocketService.off('performanceUpdate', handlePerformanceUpdate);
        };
    }, []);

    return (
        <Card className="w-full h-[300px]">
            <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="timestamp" tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}/>
                        <YAxis yAxisId="left"/>
                        <YAxis yAxisId="right" orientation="right"/>
                        <Tooltip labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}/>
                        <Line yAxisId="left" type="monotone" dataKey="cpuUsage" stroke="#8884d8" name="CPU Usage (%)"/>
                        <Line yAxisId="left" type="monotone" dataKey="memoryUsage" stroke="#82ca9d" name="Memory Usage (%)"/>
                        <Line yAxisId="right" type="monotone" dataKey="activeAgents" stroke="#ffc658" name="Active Agents"/>
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
