export interface EvaluationCase {
  id: string;
  input: string;
  expectedOutput?: string;
  metadata?: Record<string, any>;
}

export interface EvaluationDataset {
  id: string;
  name: string;
  description?: string;
  cases: EvaluationCase[];
  tags?: string[];
  createdAt?: string;
  createdBy?: string;
}

export interface EvaluationCriteria {
  name: string;
  metric: string;
  weight?: number;
  parameters?: Record<string, any>;
}

export interface EvaluationResult {
  id: string;
  modelId: string;
  datasetId: string;
  datasetName: string;
  timestamp: string;
  duration: number;
  caseResults: Array<{
    caseId: string;
    input: string;
    expectedOutput?: string;
    actualOutput?: string;
    error?: string;
    metrics: Record<string, number>;
  }>;
  aggregateScores: Record<string, number>;
  criteria: string[];
  metadata?: Record<string, any>;
}

export interface EvaluationMetric {
  name: string;
  description: string;
  calculate: (
    input: string,
    output: string,
    expectedOutput?: string,
    parameters?: Record<string, any>
  ) => Promise<number>;
}
