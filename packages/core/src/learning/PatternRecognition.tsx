import { Injectable } from '@nestjs/common';
import { Logger } from '@the-new-fuse/utils';
import { LearningEvent, LearningPattern } from './LearningSystem.js';
import { DatabaseService } from '@the-new-fuse/database';

export interface PatternMatch {
  pattern: LearningPattern;
  confidence: number;
  matchedFeatures: string[];
}

@Injectable()
export class PatternRecognition {
  private logger: Logger;
  private readonly db: DatabaseService;
  private readonly minConfidence: number = 0.7;
  private readonly maxPatternAge: number = 30; // days

  constructor(db: DatabaseService) {
    this.logger = new Logger('PatternRecognition');
    this.db = db;
  }

  public async findPatterns(events: LearningEvent[]): Promise<LearningPattern[]> {
    try {
      const patterns: LearningPattern[] = [];

      // Group events by type
      const eventsByType = this.groupEventsByType(events);

      // Analyze each event type
      for (const [type, typeEvents] of eventsByType.entries()) {
        const typePatterns = await this.analyzeEventType(type, typeEvents);
        patterns.push(...typePatterns);
      }

      return patterns;
    } catch (error) {
      this.logger.error('Error finding patterns:', error);
      return [];
    }
  }

  private groupEventsByType(events: LearningEvent[]): Map<string, LearningEvent[]> {
    const eventsByType = new Map<string, LearningEvent[]>();
    
    for (const event of events) {
      const eventsOfType = eventsByType.get(event.type) || [];
      eventsOfType.push(event);
      eventsByType.set(event.type, eventsOfType);
    }
    
    return eventsByType;
  }

  private async analyzeEventType(type: string, events: LearningEvent[]): Promise<LearningPattern[]> {
    const patterns: LearningPattern[] = [];
    
    // Find different types of patterns
    const temporalPatterns = await this.findTemporalPatterns(events);
    const sequentialPatterns = await this.findSequentialPatterns(events);
    const contextPatterns = await this.findContextPatterns(events);
    
    patterns.push(...temporalPatterns, ...sequentialPatterns, ...contextPatterns);
    
    return patterns;
  }

  private async findTemporalPatterns(events: LearningEvent[]): Promise<LearningPattern[]> {
    const patterns: LearningPattern[] = [];
    
    // Sort events by timestamp
    events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Find periodic patterns
    const intervals: number[] = [];
    
    // Calculate intervals between events
    for (let i = 1; i < events.length; i++) {
      const interval = events[i].timestamp.getTime() - events[i-1].timestamp.getTime();
      intervals.push(interval);
    }
    
    if (intervals.length >= 3) {
      const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      const variance = this.calculateVariance(intervals, averageInterval);
      
      if (variance < 0.1 * averageInterval) { // If variance is less than 10% of average
        patterns.push({
          id: crypto.randomUUID(),
          name: `Periodic Pattern - ${events[0].type}`,
          description: `Events occur approximately every ${Math.round(averageInterval / 1000)} seconds`,
          pattern: {
            type: 'periodic',
            interval: averageInterval
          },
          confidence: 1 - (variance / averageInterval),
          occurrences: events.length,
          lastSeen: events[events.length - 1].timestamp,
          metadata: {
            averageInterval,
            variance
          }
        });
      }
    }
    
    // Find time clusters
    const clusterPatterns = this.detectTimeClusters(events);
    patterns.push(...clusterPatterns);
    
    return patterns;
  }

  private detectTimeClusters(events: LearningEvent[]): LearningPattern[] {
    const patterns: LearningPattern[] = [];
    const clusters: LearningEvent[][] = [];
    let currentCluster: LearningEvent[] = [events[0]];
    
    // Group events into time-based clusters
    for (let i = 1; i < events.length; i++) {
      const timeDiff = events[i].timestamp.getTime() - events[i-1].timestamp.getTime();
      
      if(timeDiff < 60000) { // Events within 1 minute
        currentCluster.push(events[i]);
      } else {
        if(currentCluster.length > 1) {
          clusters.push(currentCluster);
        }
        currentCluster = [events[i]];
      }
    }
    
    if(currentCluster.length > 1) {
      clusters.push(currentCluster);
    }
    
    // Create patterns from clusters
    for (const cluster of clusters) {
      if(cluster.length >= 3) { // Minimum cluster size
        patterns.push({
          id: crypto.randomUUID(),
          name: `Time Cluster Pattern - ${cluster[0].type}`,
          description: `Group of ${cluster.length} events within ${Math.round((cluster[cluster.length-1].timestamp.getTime() - cluster[0].timestamp.getTime()) / 1000)} seconds`,
          pattern: {
            type: 'cluster',
            size: cluster.length,
            duration: cluster[cluster.length-1].timestamp.getTime() - cluster[0].timestamp.getTime()
          },
          confidence: 0.8,
          occurrences: 1,
          lastSeen: cluster[cluster.length-1].timestamp,
          metadata: {
            clusterSize: cluster.length,
            startTime: cluster[0].timestamp,
            endTime: cluster[cluster.length-1].timestamp
          }
        });
      }
    }
    
    return patterns;
  }

  private async findSequentialPatterns(events: LearningEvent[]): Promise<LearningPattern[]> {
    const patterns: LearningPattern[] = [];
    const sequences: LearningEvent[][] = [];
    
    // Find sequences of related events
    let currentSequence: LearningEvent[] = [events[0]];
    
    for (let i = 1; i < events.length; i++) {
      if (this.areEventsRelated(events[i-1], events[i])) {
        currentSequence.push(events[i]);
      } else {
        if(currentSequence.length > 1) {
          sequences.push(currentSequence);
        }
        currentSequence = [events[i]];
      }
    }
    
    if(currentSequence.length > 1) {
      sequences.push(currentSequence);
    }
    
    // Create patterns from sequences
    for (const sequence of sequences) {
      if(sequence.length >= 2) {
        patterns.push({
          id: crypto.randomUUID(),
          name: `Sequential Pattern - ${sequence[0].type}`,
          description: `Sequence of ${sequence.length} related events`,
          pattern: {
            type: 'sequence',
            events: sequence.map(e => ({ type: e.type, context: e.context }))
          },
          confidence: 0.7,
          occurrences: 1,
          lastSeen: sequence[sequence.length-1].timestamp,
          metadata: {
            sequenceLength: sequence.length,
            eventTypes: sequence.map(e => e.type)
          }
        });
      }
    }
    
    return patterns;
  }

  private async findContextPatterns(events: LearningEvent[]): Promise<LearningPattern[]> {
    const patterns: LearningPattern[] = [];
    const contextGroups = new Map<string, LearningEvent[]>();
    
    // Group events by context
    for(const event of events) {
      const contextKey = JSON.stringify(event.context);
      const group = contextGroups.get(contextKey) || [];
      group.push(event);
      contextGroups.set(contextKey, group);
    }
    
    // Analyze context groups
    for (const [contextKey, groupEvents] of contextGroups.entries()) {
      if(groupEvents.length >= 3) {
        patterns.push({
          id: crypto.randomUUID(),
          name: `Context Pattern - ${groupEvents[0].type}`,
          description: `Events sharing similar context`,
          pattern: {
            type: 'context',
            context: JSON.parse(contextKey)
          },
          confidence: 0.75,
          occurrences: groupEvents.length,
          lastSeen: groupEvents[groupEvents.length-1].timestamp,
          metadata: {
            contextKey,
            eventCount: groupEvents.length
          }
        });
      }
    }
    
    return patterns;
  }

  private areEventsRelated(event1: LearningEvent, event2: LearningEvent): boolean {
    // Check if events are close in time
    const timeThreshold = 5 * 60 * 1000; // 5 minutes
    const timeDiff = Math.abs(event2.timestamp.getTime() - event1.timestamp.getTime());
    
    if (timeDiff > timeThreshold) {
      return false;
    }
    
    // Check if events share context properties
    const context1 = event1.context;
    const context2 = event2.context;
    const sharedKeys = Object.keys(context1).filter(key => 
      context2.hasOwnProperty(key) && context1[key] === context2[key]
    );
    
    return sharedKeys.length > 0;
  }

  private calculateVariance(numbers: number[], mean: number): number {
    return numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
  }
}
