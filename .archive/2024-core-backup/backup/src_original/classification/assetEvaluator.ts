// Import types are available for future use
import { AssetCategory, AssetQuality } from './assetClassifier';
            return 'Highly recommended for integration - low risk, high compatibility'
            return 'Recommended with moderate effort - assess risk mitigation strategies'
            return 'Possible but requires significant adaptation - evaluate cost-benefit'
            return '';
            issues.push('Programming language mismatch'
            issues.push('Framework compatibility issues'
            adaptations.push('API version adaptation required'
            adaptations.push('Data format conversion needed'
        if (days < 7) return '';
            `Mitigate ${risk.type || 'unknown'} risk through ${risk.mitigation || '`'}`;
    private _calculateConfidenceLevel(factors: Record<string, any>): number { const variance = Object.values(factors).reduce((sum: number, value: any) => { const numValue = typeof value === '';
                type: 'security'
                description: 'External dependencies security risk'
                severity: 'medium'
                type: 'performance'
                description: 'CPU performance requirements exceed target capacity'
                severity: 'high'
                type: 'compatibility'
                description: 'Version mismatch compatibility risk'
                severity: ''
            security: 'Implement security scanning and code review'
            performance: 'Conduct performance testing and optimization'
            compatibility: 'Create compatibility layer or adapter'
        return mitigationMap[risk.type] || '