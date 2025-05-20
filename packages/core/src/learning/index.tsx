import { Injectable } from '@nestjs/common';
import {
  LearningData,
  LearningType,
  LearningConfig,
  LearningMetrics,
  Pattern,
  Adaptation,
} from './types.js';
import { PatternRecognizer } from './pattern.js';
import { SystemAdaptor } from './adaptor.js';
import { MemorySystem } from '../memory.js';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LearningSystem {
  private readonly config: LearningConfig;

  constructor(
    private readonly memory: MemorySystem,
    private readonly patterns: PatternRecognizer,
    private readonly adaptor: SystemAdaptor,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.config = {
      enabled: this.configService.get('LEARNING_ENABLED', true),
      adaptationThreshold: this.configService.get('ADAPTATION_THRESHOLD', 0.8),
      minConfidence: this.configService.get('LEARNING_MIN_CONFIDENCE', 0.6),
      maxPatterns: this.configService.get('LEARNING_MAX_PATTERNS', 1000),
      learningRate: this.configService.get('LEARNING_RATE', 0.1),
      decayFactor: this.configService.get('LEARNING_DECAY_FACTOR', 0.95),
      features: {
        patternRecognition: this.configService.get('FEATURE_PATTERN_RECOGNITION', true),
        errorLearning: this.configService.get('FEATURE_ERROR_LEARNING', true),
        performanceOptimization: this.configService.get('FEATURE_PERFORMANCE_OPTIMIZATION', true),
        userAdaptation: this.configService.get('FEATURE_USER_ADAPTATION', true),
      },
    };
  }

  async learn(data: Omit<LearningData, 'id' | 'metadata'>): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const learningData: LearningData = {
      ...data,
      id: uuidv4(),
      metadata: {
        timestamp: new Date(),
        version: this.configService.get('APP_VERSION', '1.0.0'),
        tags: [],
        performance: {
          executionTime: 0,
          memoryUsage: 0,
        },
      },
    };

    try {
      const startTime = process.hrtime();

      // Store learning data in memory
      await this.memory.store({
        id: learningData.id,
        content: JSON.stringify(learningData),
        type: 'LEARNING',
        timestamp: (learningData as any).metadata.timestamp,
        metadata: {
          type: learningData.type,
          tags: (learningData as any).metadata.tags,
        },
      });

      // Analyze patterns if feature is enabled
      if (this.config.features.patternRecognition) {
        const patterns = await this.patterns.analyze(learningData);
        await this.adaptor.adjust(patterns);
      }

      // Calculate performance metrics
      const [seconds, nanoseconds] = process.hrtime(startTime);
      (learningData as any).metadata.performance = {
        executionTime: seconds * 1000 + nanoseconds / 1e6, // Convert to milliseconds
        memoryUsage: process.memoryUsage().heapUsed,
      };
    } catch (error) {
      console.error('Error in learning process:', error);
      this.eventEmitter.emit('learning.error', { data: learningData, error });
    }
  }

  async getMetrics(): Promise<LearningMetrics> {
    const memories = await this.memory.query({
      type: 'LEARNING',
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
    });

    const learningData = memories.map(m => JSON.parse(m.content));
    const adaptations = await this.adaptor.getActiveAdaptations();

    let totalConfidence = 0;
    let successCount = 0;

    learningData.forEach(data => {
      if ((data as any).metadata?.confidence) {
        totalConfidence += (data as any).metadata.confidence;
        successCount++;
      }
    });

    const performanceMetrics = this.calculatePerformanceMetrics(learningData);

    return {
      totalSamples: learningData.length,
      patternCount: await this.getPatternCount(),
      adaptationCount: adaptations.length,
      averageConfidence: learningData.length > 0 ? totalConfidence / learningData.length : 0,
      successRate: learningData.length > 0 ? successCount / learningData.length : 0,
      learningProgress: this.calculateLearningProgress(learningData),
      recentAdaptations: adaptations.slice(0, 10), // Last 10 adaptations
      performanceMetrics,
    };
  }

  private async getPatternCount(): Promise<number> {
    const patterns = await this.memory.query({
      type: 'LEARNING',
      metadata: {
        patternType: { $exists: true },
      },
    });
    
    if (patterns.length === 0) {
      return 0;
    }
    
    return patterns.length;
  }

  private calculateLearningProgress(data: LearningData[]): number {
    if (data.length === 0) {
      return 0;
    }

    const recentData = data.slice(-100); // Look at last 100 samples
    
    const confidences = recentData.map(d => 
      (d as any).metadata?.confidence || 0
    );
    
    // Get average confidence from recent data
    const avgConfidence = confidences.reduce(
      (sum, confidence) => sum + confidence, 
      0
    ) / confidences.length;
    
    // Calculate a normalized learning progress between 0-1
    return Math.min(avgConfidence, 1);
  }

  private calculatePerformanceMetrics(data: LearningData[]): {
    accuracy: number;
    latency: number;
    efficiency: number;
  } {
    if (data.length === 0) {
      return {
        accuracy: 0,
        latency: 0,
        efficiency: 0,
      };
    }

    // Get performance metrics from each data point
    const metrics = data
      .filter(d => (d as any).metadata?.performance)
      .map(d => (d as any).metadata.performance!);

    if (metrics.length === 0) {
      return {
        accuracy: 0,
        latency: 0,
        efficiency: 0,
      };
    }

    const totalExecutionTime = metrics.reduce(
      (sum, m) => sum + (m.executionTime || 0),
      0
    );
    
    const totalMemoryUsage = metrics.reduce(
      (sum, m) => sum + (m.memoryUsage || 0),
      0
    );

    const accuracy = data.filter(d => d.feedback?.type === 'POSITIVE').length / data.length;
    const latency = totalExecutionTime / metrics.length;
    const efficiency = 1 - (totalMemoryUsage / metrics.length) / (1024 * 1024 * 100); // Normalize to 100MB

    return {
      accuracy,
      latency,
      efficiency,
    };
  }

  async reset(): Promise<void> {
    const memories = await this.memory.query({
      type: 'LEARNING',
    });

    await Promise.all(
      memories.map(memory => this.memory.delete(memory.id)),
    );

    // Reset adaptations
    const adaptations = await this.adaptor.getActiveAdaptations();
    await Promise.all(
      adaptations.map(adaptation =>
        this.adaptor.adjust([
          {
            ...(adaptation as any).trigger.pattern,
            confidence: 0,
          },
        ]),
      ),
    );

    this.eventEmitter.emit('learning.reset');
  }
}
