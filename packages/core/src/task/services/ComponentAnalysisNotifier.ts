import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ComponentAnalysisNotifier {
  private readonly SIGNIFICANT_CHANGE_THRESHOLD = 5; // 5% change is considered significant

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async notifyResults(results: any, trends: any) {
    // Emit event for any subscribers
    this.eventEmitter.emit('component-analysis.completed', { results, trends });

    // Check for significant changes
    if (trends && this.hasSignificantChanges(trends)) {
      this.eventEmitter.emit('component-analysis.significant-change', {
        results,
        trends,
        changes: this.getSignificantChanges(trends)
      });
    }
  }

  async notifyError(error: Error) {
    this.eventEmitter.emit('component-analysis.error', { error });
  }

  private hasSignificantChanges(trends: any): boolean {
    const { unusedPercentage } = trends.trends;
    return Math.abs(unusedPercentage.change) >= this.SIGNIFICANT_CHANGE_THRESHOLD;
  }

  private getSignificantChanges(trends: any) {
    const changes = [];
    const { totalComponents, potentiallyLost, unusedPercentage } = trends.trends;

    if (Math.abs(unusedPercentage.change) >= this.SIGNIFICANT_CHANGE_THRESHOLD) {
      changes.push({
        metric: 'Unused Component Percentage',
        change: unusedPercentage.change.toFixed(2) + '%',
        type: unusedPercentage.change > 0 ? 'increase' : 'decrease'
      });
    }

    if (Math.abs(totalComponents.change) >= 10) { // 10+ component change
      changes.push({
        metric: 'Total Components',
        change: totalComponents.change,
        type: totalComponents.change > 0 ? 'increase' : 'decrease'
      });
    }

    return changes;
  }
}