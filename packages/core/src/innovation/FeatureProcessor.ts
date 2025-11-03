import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface Feature {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'analyzing' | 'prioritized' | 'in-progress' | 'completed';
  complexity: number; // 1-10 scale
  impact: number; // 1-10 scale
  priority?: 'low' | 'medium' | 'high';
  estimatedTimeframe?: number; // in days
}

@Injectable()
export class FeatureProcessor {
  private readonly logger = new Logger(FeatureProcessor.name);
  private features: Feature[] = [];

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async submitFeature(featureData: Omit<Feature, 'id' | 'status'>): Promise<Feature> {
    const newFeature: Feature = {
      ...featureData,
      id: `feature-${Date.now()}`,
      status: 'pending',
    };
    this.features.push(newFeature);
    this.logger.log(`New feature submitted: ${newFeature.name}`);
    this.eventEmitter.emit('feature.submitted', newFeature);

    // Trigger analysis asynchronously
    this.analyzeFeature(newFeature.id);

    return newFeature;
  }

  private async analyzeFeature(featureId: string): Promise<void> {
    const feature = this.features.find(f => f.id === featureId);
    if (!feature || feature.status !== 'pending') return;

    this.logger.log(`Analyzing feature: ${feature.name}`);
    feature.status = 'analyzing';

    // Simulate analysis process
    await new Promise(resolve => setTimeout(resolve, 1000));

    feature.priority = this.determinePriority(feature.impact);
    feature.estimatedTimeframe = this.estimateTimeframe(feature.complexity);
    feature.status = 'prioritized';

    this.logger.log(`Feature '${feature.name}' analyzed and prioritized as '${feature.priority}'.`);
    this.eventEmitter.emit('feature.analyzed', feature);
  }

  private determinePriority(impact: number): 'low' | 'medium' | 'high' {
    if (impact > 7) return 'high';
    if (impact > 4) return 'medium';
    return 'low';
  }

  private estimateTimeframe(complexity: number): number {
    // Simple estimation logic: complexity in days
    return complexity;
  }

  getPrioritizedFeatures(): Feature[] {
    return this.features
      .filter(f => f.status === 'prioritized')
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      });
  }

  startWorkOnFeature(featureId: string): boolean {
    const feature = this.features.find(f => f.id === featureId && f.status === 'prioritized');
    if (feature) {
      feature.status = 'in-progress';
      this.logger.log(`Work started on feature: ${feature.name}`);
      this.eventEmitter.emit('feature.work.started', feature);
      return true;
    }
    this.logger.warn(`Could not start work on feature ${featureId}. It might not be in a 'prioritized' state.`);
    return false;
  }
}
