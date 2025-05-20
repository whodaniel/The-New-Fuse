"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import client_1 from '@the-new-fuse/database/client';
import FeatureTrackingService_1 from '../packages/database/src/services/FeatureTrackingService.js';
import feature_tracker_1 from '@the-new-fuse/feature-tracker';
async function populateFeatureTracker() {
    const prisma = new client_1.PrismaClient();
    const featureService = new FeatureTrackingService_1.FeatureTrackingService(prisma);
    try {
        const coreFeature = await featureService.createFeature('Core System', 'Core functionality and infrastructure of The New Fuse', []);
        const dbFeature = await featureService.createFeature('Database Layer', 'Database infrastructure and ORM integration', [coreFeature.featureId]);
        const agentFeature = await featureService.createFeature('Agent System', 'AI agent infrastructure and communication', [coreFeature.featureId, dbFeature.featureId]);
        const securityFeature = await featureService.createFeature('Security System', 'Authentication, authorization, and security infrastructure', [coreFeature.featureId, dbFeature.featureId]);
        const layoutFeature = await featureService.createFeature('Layout System', 'UI layout and component infrastructure', [coreFeature.featureId]);
        await featureService.updateStage(coreFeature.featureId, feature_tracker_1.FeatureStage.DEVELOPMENT, feature_tracker_1.FeatureStage.ANALYSIS);
        await featureService.updateMetrics(coreFeature.featureId, {
            linesOfCode: 15000,
            filesModified: ['core/**/*.ts'],
            newFiles: ['core/src/**/*.ts'],
            tokensUsed: 50000,
            testCoverage: 75
        });
        await featureService.updateQualitativeAssessment(coreFeature.featureId, {
            challenges: [
                'Maintaining backward compatibility',
                'Performance optimization for large-scale operations'
            ],
            risks: [
                'Technical debt in legacy components',
                'Scalability concerns for massive datasets'
            ],
            notes: 'Core system is stable but requires continuous optimization'
        });
        await featureService.updateStage(dbFeature.featureId, feature_tracker_1.FeatureStage.TESTING, feature_tracker_1.FeatureStage.DEVELOPMENT);
        await featureService.updateMetrics(dbFeature.featureId, {
            linesOfCode: 8000,
            filesModified: ['database/**/*.ts'],
            newFiles: ['database/src/**/*.ts'],
            tokensUsed: 25000,
            testCoverage: 85
        });
        await featureService.updateQualitativeAssessment(dbFeature.featureId, {
            challenges: [
                'Query optimization for complex operations',
                'Managing database migrations'
            ],
            risks: [
                'Data consistency in distributed operations',
                'Performance impact of complex queries'
            ],
            notes: 'Database layer is robust with good test coverage'
        });
        await featureService.updateStage(agentFeature.featureId, feature_tracker_1.FeatureStage.DEVELOPMENT, feature_tracker_1.FeatureStage.DESIGN);
        await featureService.updateMetrics(agentFeature.featureId, {
            linesOfCode: 12000,
            filesModified: ['agent/**/*.ts'],
            newFiles: ['agent/src/**/*.ts'],
            tokensUsed: 40000,
            testCoverage: 70
        });
        await featureService.updateQualitativeAssessment(agentFeature.featureId, {
            challenges: [
                'Complex state management in agent interactions',
                'Optimizing AI response times'
            ],
            risks: [
                'AI model reliability',
                'Resource consumption in large-scale deployments'
            ],
            notes: 'Agent system is evolving with new AI capabilities being added'
        });
        await featureService.updateStage(securityFeature.featureId, feature_tracker_1.FeatureStage.REVIEW, feature_tracker_1.FeatureStage.TESTING);
        await featureService.updateMetrics(securityFeature.featureId, {
            linesOfCode: 6000,
            filesModified: ['security/**/*.ts'],
            newFiles: ['security/src/**/*.ts'],
            tokensUsed: 20000,
            testCoverage: 90
        });
        await featureService.updateQualitativeAssessment(securityFeature.featureId, {
            challenges: [
                'Implementing robust authentication flows',
                'Managing security policies'
            ],
            risks: [
                'Potential security vulnerabilities',
                'Compliance with data protection regulations'
            ],
            notes: 'Security system has undergone thorough testing and review'
        });
        await featureService.updateStage(layoutFeature.featureId, feature_tracker_1.FeatureStage.DEVELOPMENT, feature_tracker_1.FeatureStage.DESIGN);
        await featureService.updateMetrics(layoutFeature.featureId, {
            linesOfCode: 4000,
            filesModified: ['layout/**/*.ts', 'layout/**/*.tsx'],
            newFiles: ['layout/src/**/*.tsx'],
            tokensUsed: 15000,
            testCoverage: 65
        });
        await featureService.updateQualitativeAssessment(layoutFeature.featureId, {
            challenges: [
                'Maintaining consistent UI/UX across components',
                'Responsive design implementation'
            ],
            risks: [
                'Browser compatibility issues',
                'Performance impact of complex layouts'
            ],
            notes: 'Layout system is being enhanced with new component templates'
        });
        
    }
    catch (error) {
        console.error('Error populating feature tracker:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
populateFeatureTracker();
//# sourceMappingURL=populate-feature-tracker.js.map