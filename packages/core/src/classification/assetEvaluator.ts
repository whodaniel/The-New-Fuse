export interface EvaluationFactors {
  compatibility: number;
  complexity: number;
  risk: number;
  effort: number;
  value: number;
}

export interface RiskAssessment {
  type: 'security' | 'performance' | 'compatibility' | 'maintenance';
  description: string;
  severity: 'low' | 'medium' | 'high';
  mitigation?: string;
}

export interface EvaluationResult {
  score: number;
  recommendation: string;
  risks: RiskAssessment[];
  adaptations: string[];
  timeline: string;
  confidence: number;
}

export class AssetEvaluator {
  evaluate(factors: EvaluationFactors): EvaluationResult {
    const score = this._calculateScore(factors);
    const recommendation = this._generateRecommendation(score);
    const risks = this._identifyRisks(factors);
    const adaptations = this._identifyAdaptations(factors);
    const timeline = this._estimateTimeline(factors);
    const confidence = this._calculateConfidenceLevel(factors);

    return {
      score,
      recommendation,
      risks,
      adaptations,
      timeline,
      confidence,
    };
  }

  private _calculateScore(factors: EvaluationFactors): number {
    const { compatibility, complexity, risk, effort, value } = factors;
    
    // Weighted scoring algorithm
    const weights = {
      compatibility: 0.3,
      complexity: 0.2,
      risk: -0.25,
      effort: -0.15,
      value: 0.3,
    };

    return Math.max(0, Math.min(100,
      (compatibility * weights.compatibility) +
      ((10 - complexity) * weights.complexity) +
      ((10 - risk) * weights.risk) +
      ((10 - effort) * weights.effort) +
      (value * weights.value)
    ));
  }

  private _generateRecommendation(score: number): string {
    if (score >= 80) {
      return 'Highly recommended for integration - low risk, high compatibility';
    } else if (score >= 60) {
      return 'Recommended with moderate effort - assess risk mitigation strategies';
    } else if (score >= 40) {
      return 'Possible but requires significant adaptation - evaluate cost-benefit';
    } else {
      return 'Not recommended - high risk or low compatibility';
    }
  }

  private _identifyRisks(factors: EvaluationFactors): RiskAssessment[] {
    const risks: RiskAssessment[] = [];

    if (factors.risk > 7) {
      risks.push({
        type: 'security',
        description: 'External dependencies security risk',
        severity: 'medium',
        mitigation: 'Implement security scanning and code review',
      });
    }

    if (factors.complexity > 8) {
      risks.push({
        type: 'performance',
        description: 'CPU performance requirements exceed target capacity',
        severity: 'high',
        mitigation: 'Conduct performance testing and optimization',
      });
    }

    if (factors.compatibility < 5) {
      risks.push({
        type: 'compatibility',
        description: 'Version mismatch compatibility risk',
        severity: 'medium',
        mitigation: 'Create compatibility layer or adapter',
      });
    }

    return risks;
  }

  private _identifyAdaptations(factors: EvaluationFactors): string[] {
    const adaptations: string[] = [];

    if (factors.compatibility < 7) {
      adaptations.push('API version adaptation required');
    }

    if (factors.complexity > 6) {
      adaptations.push('Data format conversion needed');
    }

    if (factors.effort > 7) {
      adaptations.push('Refactoring for integration');
    }

    return adaptations;
  }

  private _estimateTimeline(factors: EvaluationFactors): string {
    const days = Math.ceil(factors.effort * 2 + factors.complexity * 1.5);
    
    if (days < 7) return '1 week';
    if (days < 14) return '2 weeks';
    if (days < 30) return '1 month';
    if (days < 60) return '2 months';
    return '3+ months';
  }

  private _calculateConfidenceLevel(factors: Record<string, any>): number {
    const variance = Object.values(factors).reduce((sum: number, value: any) => {
      const numValue = typeof value === 'number' ? value : 5;
      return sum + Math.pow(numValue - 5, 2);
    }, 0);

    return Math.max(0.5, 1 - (variance / 100));
  }
}