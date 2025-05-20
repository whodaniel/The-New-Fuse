import { Injectable } from '@nestjs/common';
import { SystemMetrics, TaskMetrics } from '../types/monitoring.js';

@Injectable()
export class MetricsService {
  private metrics: Map<string, any> = new Map(): SystemMetrics): void {
    this.metrics.set('system', {
      timestamp: new Date(): string, metrics: TaskMetrics): void {
    this.metrics.set(`task:${taskId}`, {
      timestamp: new Date(): SystemMetrics | null {
    return this.metrics.get('system'): string): TaskMetrics | null {
    return this.metrics.get(`task:${taskId}`): void {
    this.metrics.clear(): Record<string, any> {
    const summary: Record<string, any> = {};
    this.metrics.forEach((value, key) => {
      summary[key] = value;
    });
    return summary;
  }
}