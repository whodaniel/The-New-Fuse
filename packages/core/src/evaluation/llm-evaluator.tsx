import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../logging.js';
import { SmartAPIGateway } from '../api-management/SmartAPIGateway.js';
import {
  EvaluationResult,
  EvaluationCriteria,
  EvaluationDataset,
  EvaluationCase,
  EvaluationMetric
} from './types.js';

export class LLMEvaluator {
  private logger: Logger;
  private apiGateway: SmartAPIGateway;
  private metrics: Map<string, EvaluationMetric> = new Map();
  
  constructor(logger: Logger, apiGateway: SmartAPIGateway) {
    this.logger = logger;
    this.apiGateway = apiGateway;
  }
  
  /**
   * Register an evaluation metric
   */
  registerMetric(metric: EvaluationMetric): void {
    this.metrics.set(metric.name, metric);
    this.logger.info(`Registered evaluation metric: ${metric.name}`);
  }
  
  /**
   * Evaluate a model on a dataset using specified criteria
   */
  async evaluateModel(
    modelId: string,
    dataset: EvaluationDataset,
    criteria: EvaluationCriteria[]
  ): Promise<EvaluationResult> {
    const startTime = Date.now();
    const runId = uuidv4();
    
    this.logger.info(`Starting evaluation run ${runId} for model ${modelId} on dataset ${dataset.name}`);
    
    const results: any[] = [];
    const scores: Record<string, number[]> = {};
    
    // Initialize scores object for each criterion
    criteria.forEach(criterion => {
      scores[criterion.name] = [];
    });
    
    // Process each evaluation case
    for (const [index, testCase] of dataset.cases.entries()) {
      try {
        this.logger.debug(`Processing case ${index + 1}/${dataset.cases.length}`);
        
        // Generate model completion
        const completion = await this.apiGateway.callLLM({
          prompt: testCase.input,
          model: modelId
        });
        
        const caseResult = {
          caseId: testCase.id,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: completion.completion,
          metrics: {}
        };
        
        // Evaluate each criterion
        for (const criterion of criteria) {
          const metricImpl = this.metrics.get(criterion.metric);
          
          if (!metricImpl) {
            throw new Error(`Unknown evaluation metric: ${criterion.metric}`);
          }
          
          const score = await metricImpl.calculate(
            testCase.input,
            completion.completion,
            testCase.expectedOutput,
            criterion.parameters
          );
          
          caseResult.metrics[criterion.name] = score;
          scores[criterion.name].push(score);
        }
        
        results.push(caseResult);
      } catch (error) {
        this.logger.error(`Error evaluating case ${testCase.id}:`, error);
        
        // Add failed case with error
        results.push({
          caseId: testCase.id,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          error: error.message,
          metrics: {}
        });
        
        // Add zero scores for failed cases
        criteria.forEach(criterion => {
          scores[criterion.name].push(0);
        });
      }
    }
    
    // Calculate aggregate scores
    const aggregateScores: Record<string, number> = {};
    
    Object.entries(scores).forEach(([criterion, scoreList]) => {
      aggregateScores[criterion] = this.calculateAverage(scoreList);
    });
    
    const evaluationResult: EvaluationResult = {
      id: runId,
      modelId,
      datasetId: dataset.id,
      datasetName: dataset.name,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      caseResults: results,
      aggregateScores,
      criteria: criteria.map(c => c.name)
    };
    
    this.logger.info(`Evaluation complete: run ${runId}`, { aggregateScores });
    
    return evaluationResult;
  }
  
  /**
   * Calculate the average of an array of numbers
   */
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((acc, val) => acc + val, 0);
    return sum / numbers.length;
  }
}
