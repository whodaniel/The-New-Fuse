import { Injectable } from '@nestjs/common';
import { Pattern, AdaptationResult } from './LearningTypes.js';
import { Logger } from '@the-new-fuse/utils';
import { DatabaseService } from '@the-new-fuse/database';
import { ConfigService } from '@nestjs/config';
import { EventEmitter } from 'events';

@Injectable()
export class SystemAdaptor extends EventEmitter {
  private logger: Logger;
  private db: DatabaseService;
  private readonly minConfidenceThreshold: number;
  private readonly maxAdaptationsPerDay: number;
  private adaptationCount: number;
  private lastReset: Date;

  constructor(
    db: DatabaseService,
    configService: ConfigService
  ) {
    super();
    this.logger = new Logger('SystemAdaptor');
    this.db = db;
    this.minConfidenceThreshold = configService.get<number>('learning.minConfidenceThreshold', 0.7);
    this.maxAdaptationsPerDay = configService.get<number>('learning.maxAdaptationsPerDay', 10);
    this.adaptationCount = 0;
    this.lastReset = new Date();
  }

  public async adaptSystem(patterns: Pattern[]): Promise<AdaptationResult> {
    try {
      // Reset adaptation count if a day has passed
      this.checkAndResetAdaptationCount();

      // Filter out patterns that don't meet confidence threshold
      const validPatterns = patterns.filter(p => p.confidence >= this.minConfidenceThreshold);

      if (validPatterns.length === 0) {
        this.logger.warn('No valid patterns to apply');
        return this.createAdaptationResult(false, [], [], []);
      }

      // Check if maximum adaptations per day has been reached
      if (this.adaptationCount >= this.maxAdaptationsPerDay) {
        this.logger.warn('Maximum daily adaptations reached');
        return this.createAdaptationResult(false, [], [], []);
      }

      const startTime = Date.now();

      // Apply adaptations based on patterns
      const result = await this.applyAdaptations(validPatterns);
      const duration = Date.now() - startTime;

      // Update adaptation count
      this.adaptationCount++;

      // Create and return result
      return {
        success: true,
        changes: result.changes,
        metrics: {
          confidence: this.calculateAverageConfidence(validPatterns),
          impact: this.calculateImpact(result.changes),
          duration
        }
      };
    } catch (error) {
      this.logger.error('Error during system adaptation:', error);
      return this.createAdaptationResult(false, [], [], []);
    }
  }

  private async applyAdaptations(patterns: Pattern[]): Promise<{
    changes: {
      added: Pattern[];
      modified: Pattern[];
      removed: Pattern[];
    };
  }> {
    const changes = {
      added: [] as Pattern[],
      modified: [] as Pattern[],
      removed: [] as Pattern[]
    };

    for (const pattern of patterns) {
      // Check if pattern already exists
      const existing = await this.db.patterns.findUnique({
        where: { id: pattern.id }
      });

      if(!existing) {
        // New pattern
        await this.db.patterns.create({ data: pattern });
        changes.added.push(pattern);
        this.emit('patternAdded', pattern);
      } else if (this.shouldUpdatePattern(existing, pattern)) {
        // Update existing pattern
        await this.db.patterns.update({
          where: { id: pattern.id },
          data: pattern
        });
        changes.modified.push(pattern);
        this.emit('patternModified', pattern);
      }
    }

    // Check for patterns to remove
    const patternsToRemove = await this.findPatternsToRemove(patterns);
    
    if (patternsToRemove.length > 0) {
      await this.db.patterns.deleteMany({
        where: { id: { in: patternsToRemove.map(p => p.id) } }
      });
      changes.removed.push(...patternsToRemove);
      this.emit('patternsRemoved', patternsToRemove);
    }

    return { changes };
  }

  private shouldUpdatePattern(existing: Pattern, newPattern: Pattern): boolean {
    return (
      newPattern.confidence > existing.confidence ||
      newPattern.frequency > existing.frequency ||
      Object.keys(newPattern.context).length > Object.keys(existing.context).length
    );
  }

  private async findPatternsToRemove(patterns: Pattern[]): Promise<Pattern[]> {
    // Find patterns that haven't been reinforced recently
    const oldPatterns = await this.db.patterns.findMany({
      where: {
        AND: [
          { updated: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }, // 30 days old
          { frequency: { lt: 3 } }, // Low frequency
          { confidence: { lt: this.minConfidenceThreshold } } // Low confidence
        ]
      }
    });

    return oldPatterns;
  }

  private checkAndResetAdaptationCount(): void {
    const now = new Date();
    const dayDifference = Math.floor((now.getTime() - this.lastReset.getTime()) / (24 * 60 * 60 * 1000));
    
    if (dayDifference >= 1) {
      this.adaptationCount = 0;
      this.lastReset = now;
    }
  }

  private createAdaptationResult(
    success: boolean,
    added: Pattern[],
    modified: Pattern[],
    removed: Pattern[]
  ): AdaptationResult {
    return {
      success,
      changes: { added, modified, removed },
      metrics: {
        confidence: this.calculateAverageConfidence([...added, ...modified]),
        impact: this.calculateImpact({ added, modified, removed }),
        duration: 0
      }
    };
  }

  private calculateAverageConfidence(patterns: Pattern[]): number {
    if (!patterns.length) return 0;
    return patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
  }

  private calculateImpact(changes: {
    added: Pattern[];
    modified: Pattern[];
    removed: Pattern[];
  }): number {
    // Calculate impact score based on number and type of changes
    const addedImpact = changes.added.length * 1.0;
    const modifiedImpact = changes.modified.length * 0.5;
    const removedImpact = changes.removed.length * 0.3;
    
    return addedImpact + modifiedImpact + removedImpact;
  }
}
