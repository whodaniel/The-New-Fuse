#!/usr/bin/env node

/**
 * Self-Learning System Implementation Test
 * 
 * This script demonstrates the self-learning system by feeding it real
 * data from our session and showing how it learns from successes and failures.
 */

const { SelfLearningTaskSystem } = require('./SelfLearningTaskSystem.js');
const { SessionHonestAssessment } = require('./SessionHonestAssessment.js');

async function demonstrateSelfLearningSystem() {
    console.log('🧠 SELF-LEARNING SYSTEM DEMONSTRATION');
    console.log('═══════════════════════════════════════');
    
    // Initialize the learning system
    const learningSystem = new SelfLearningTaskSystem();
    
    console.log('📊 Phase 1: Feeding Real Session Data');
    console.log('───────────────────────────────────────');
    
    // Feed actual session results into the learning system
    for (const task of SessionHonestAssessment.tasksAttempted) {
        const attemptId = learningSystem.startTaskAttempt({
            sessionId: SessionHonestAssessment.sessionId,
            agentRole: 'Master Orchestrator Agent',
            taskType: task.taskType,
            taskDescription: task.description,
            method: task.method,
            parameters: {},
            context: {
                platform: 'The New Fuse',
                environment: 'development',
                dependencies: [],
                constraints: ['time_pressure', 'learning_curve', 'integration_complexity']
            }
        });

        learningSystem.completeTaskAttempt(attemptId, {
            success: task.success,
            successScore: task.successScore,
            failureReason: task.success ? undefined : task.notes,
            errorCount: task.success ? 0 : 1,
            retryCount: task.success ? 0 : 1
        });
        
        console.log(`   ✓ Logged: ${task.taskType} (${task.success ? 'SUCCESS' : 'FAILED'}) - Score: ${task.successScore}`);
    }
    
    console.log('\n🔮 Phase 2: Testing Learning & Recommendations');
    console.log('───────────────────────────────────────────────');
    
    // Test recommendations for different task types
    const testTasks = [
        'browser_agent_communication',
        'template_system_design', 
        'vs_code_agent_discovery',
        'coherence_drift_analysis'
    ];
    
    for (const taskType of testTasks) {
        const recommendation = learningSystem.getMethodRecommendation({
            taskType,
            context: {
                platform: 'The New Fuse',
                environment: 'development',
                dependencies: [],
                constraints: []
            }
        });
        
        console.log(`   🎯 ${taskType}:`);
        console.log(`      Recommended: ${recommendation.recommendedMethod}`);
        console.log(`      Confidence: ${(recommendation.confidence * 100).toFixed(1)}%`);
        console.log(`      Reasoning: ${recommendation.reasoning}`);
        
        if (recommendation.alternatives.length > 0) {
            console.log(`      Alternatives: ${recommendation.alternatives.map(a => 
                `${a.method} (${(a.confidence * 100).toFixed(1)}%)`
            ).join(', ')}`);
        }
        console.log('');
    }
    
    console.log('📈 Phase 3: Learning Analytics');
    console.log('─────────────────────────────');
    
    const analytics = learningSystem.getAnalytics();
    
    console.log(`   Total Attempts: ${analytics.totalAttempts}`);
    console.log(`   Overall Success Rate: ${(analytics.overallSuccessRate * 100).toFixed(1)}%`);
    console.log('');
    console.log('   Top Methods by Success Rate:');
    analytics.topMethods.forEach(method => {
        console.log(`   - ${method.method}: ${(method.successRate * 100).toFixed(1)}% (${method.usage} uses)`);
    });
    console.log('');
    console.log('   Performance Trends:');
    analytics.improvementTrends.forEach(trend => {
        console.log(`   - ${trend.taskType}: ${trend.trend}`);
    });
    console.log('');
    console.log('   Recommendations:');
    analytics.recommendations.forEach(rec => {
        console.log(`   - ${rec}`);
    });
    
    console.log('\n🧪 Phase 4: Simulating Learning Over Time');
    console.log('─────────────────────────────────────────');
    
    // Simulate improvements in browser automation over multiple attempts
    console.log('   Simulating browser automation improvements...');
    const improvementSimulation = [
        { successScore: 0.2, note: 'Initial failure - connection timeout' },
        { successScore: 0.3, note: 'Partial success - element found but interaction failed' },
        { successScore: 0.5, note: 'Better - interaction worked but response not captured' },
        { successScore: 0.7, note: 'Good - full interaction with response' },
        { successScore: 0.9, note: 'Excellent - reliable automation with error handling' }
    ];
    
    for (let i = 0; i < improvementSimulation.length; i++) {
        const attempt = improvementSimulation[i];
        const attemptId = learningSystem.startTaskAttempt({
            sessionId: `simulation_session_${i + 1}`,
            agentRole: 'Master Orchestrator Agent',
            taskType: 'browser_agent_communication',
            taskDescription: 'Simulated browser automation attempt',
            method: 'browser_automation',
            parameters: { 
                timeout: 30000 + (i * 5000), // Increasing timeout as we learn
                retryCount: 1 + i // More retries as we get better
            },
            context: {
                platform: 'The New Fuse',
                environment: 'development',
                dependencies: ['browser_snapshot', 'element_identification'],
                constraints: ['connection_timeout']
            }
        });

        learningSystem.completeTaskAttempt(attemptId, {
            success: attempt.successScore > 0.6,
            successScore: attempt.successScore,
            failureReason: attempt.successScore <= 0.6 ? attempt.note : undefined,
            errorCount: Math.floor((1 - attempt.successScore) * 3),
            retryCount: Math.floor((1 - attempt.successScore) * 2)
        });
        
        console.log(`   Attempt ${i + 1}: ${(attempt.successScore * 100).toFixed(0)}% - ${attempt.note}`);
    }
    
    // Check how recommendation changed
    const finalRecommendation = learningSystem.getMethodRecommendation({
        taskType: 'browser_agent_communication',
        context: {
            platform: 'The New Fuse',
            environment: 'development',
            dependencies: ['browser_snapshot', 'element_identification'],
            constraints: ['connection_timeout']
        }
    });
    
    console.log('\n   After learning:');
    console.log(`   New confidence for browser automation: ${(finalRecommendation.confidence * 100).toFixed(1)}%`);
    
    console.log('\n📋 Phase 5: Export Learning Data');
    console.log('─────────────────────────────────');
    
    const exportData = learningSystem.exportLearningData();
    console.log(`   Total attempts tracked: ${exportData.attempts.length}`);
    console.log(`   Methods in registry: ${exportData.methods.length}`);
    console.log(`   Neural network nodes: ${exportData.neuralNetworkState.nodeCount}`);
    console.log(`   Current overall success rate: ${(exportData.analytics.overallSuccessRate * 100).toFixed(1)}%`);
    
    // Save export data for analysis
    const fs = require('fs');
    const exportPath = './learning-system-export.json';
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    console.log(`   📁 Exported learning data to: ${exportPath}`);
    
    console.log('\n🎉 SELF-LEARNING SYSTEM DEMONSTRATION COMPLETE');
    console.log('═══════════════════════════════════════════════');
    console.log('Key Insights:');
    console.log('- System learns from both successes and failures');
    console.log('- Recommendations improve with more data');
    console.log('- Neural network adapts weights based on actual outcomes');
    console.log('- Analytics help identify patterns and improvement opportunities');
    console.log('- No external ML packages required - pure TypeScript implementation');
    
    return exportData;
}

// Run demonstration if executed directly
if (require.main === module) {
    demonstrateSelfLearningSystem()
        .then(data => {
            console.log('\n✅ Demonstration completed successfully');
            console.log(`📊 Final analytics: ${JSON.stringify(data.analytics, null, 2)}`);
        })
        .catch(error => {
            console.error('❌ Demonstration failed:', error);
            process.exit(1);
        });
}

module.exports = { demonstrateSelfLearningSystem };
