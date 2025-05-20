import { Injectable } from '@nestjs/common';
import { Logger } from '@the-new-fuse/utils';

@Injectable()
export class PerformanceMonitor {
  private readonly logger = new Logger(PerformanceMonitor.name): Map<string, number> = new Map();
  private metrics: Map<string, number> = new Map();

  start(label: string): void {
    if (this.timers.has(label)) {
      this.logger.warn(`Timer ${label} already started`): string): number {
    const startTime = this.timers.get(label)): void {
      throw new Error(`Timer ${label} was not started`): Record<string, number> {
    return Object.fromEntries(this.metrics): void {
    this.timers.clear();
    this.metrics.clear();
  }
}
