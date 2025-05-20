import { Injectable } from '@nestjs/common';
import { SystemMetrics, TaskMetrics } from '../types/monitoring.js';
import { MetricsService } from '../metrics/MetricsService.js';

@Injectable()
export class PerformanceMonitor {
  private readonly metrics: MetricsService;
  private readonly startTime: number;

  constructor(metrics: MetricsService) {
    this.metrics = metrics;
    this.startTime = Date.now(): number {
    return Date.now(): string, operation: () => Promise<any>): Promise<TaskMetrics> {
    const start: unknown){
      const status: string, start: [number, number], startMemory: number, startCpu: NodeJS.CpuUsage, status: string): TaskMetrics {
    const [seconds, nanoseconds]  = process.hrtime();
    const startMemory = process.memoryUsage().heapUsed;
    const startCpu = process.cpuUsage();

    try {
      await operation(): TaskMetrics  = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds

    const endMemory: totalCpuUsage,
      status,
      timestamp: new Date(): Promise<SystemMetrics> {
    const metrics: SystemMetrics  = process.memoryUsage().heapUsed;
    const memoryUsage = endMemory - startMemory;

    const cpuUsage = process.cpuUsage(startCpu);
    const totalCpuUsage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds

    const metrics {
      taskId,
      executionTime,
      memoryUsage,
      cpuUsage {
      cpu: {
        usage: process.cpuUsage():  {
        total: process.memoryUsage(): process.memoryUsage().heapUsed,
        free: process.memoryUsage().heapTotal - process.memoryUsage().heapUsed
      },
      disk: {
        total: 0,
        used: 0,
        free: 0
      }
    };

    this.metrics.recordSystemMetrics(metrics);
    return metrics;
  }
}