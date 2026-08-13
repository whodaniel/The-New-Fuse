export interface EvaluationResult {
  passed: boolean;
  score: number; // 0-1
  findings: EvaluationFinding[];
  executedAt: string;
  evaluator: string;
}

export interface EvaluationFinding {
  rule: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface EvaluationCriteria {
  name: string;
  weight: number;
  threshold: number;
}

export interface BusinessRule {
  id: string;
  name: string;
  condition: string; // Expression or predicate
  action: 'pass' | 'fail' | 'warn';
  priority: number;
}

export interface CodeEvalConfig {
  rules: string[];
  timeoutMs: number;
  allowNetwork: boolean;
  allowFileSystem: boolean;
}

export interface ToolCallStep {
  stepId: string;
  toolName: string;
  expectedOutput?: Record<string, unknown>;
  validation?: string;
}

export interface JudgeConfig {
  model: string;
  criteria: EvaluationCriteria[];
  temperature: number;
  maxTokens: number;
}
