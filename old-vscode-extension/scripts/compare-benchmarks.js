const fs = require('fs');
const path = require('path');

// Threshold for considering a change significant
const THRESHOLDS = {
    messageRate: -10,     // 10% decrease in message rate
    latency: 25,         // 25% increase in latency
    errorRate: 50,       // 50% increase in error rate
    memoryUsage: 25      // 25% increase in memory usage
};

function calculateChange(current, previous) {
    return ((current - previous) / previous) * 100;
}

function formatChange(change, metric) {
    const prefix = change >= 0 ? '+' : '';
    let suffix = '%';
    
    if (metric === 'latency') {
        suffix = '% slower';
    } else if (metric === 'messageRate') {
        suffix = '% throughput';
    }
    
    return `${prefix}${change.toFixed(2)}${suffix}`;
}

function analyzeRegression(changes) {
    const regressions = [];
    
    if (changes.messageRate < THRESHOLDS.messageRate) {
        regressions.push(`Message rate decreased by ${Math.abs(changes.messageRate.toFixed(2))}%`);
    }
    
    if (changes.latency > THRESHOLDS.latency) {
        regressions.push(`Latency increased by ${changes.latency.toFixed(2)}%`);
    }
    
    if (changes.errorRate > THRESHOLDS.errorRate) {
        regressions.push(`Error rate increased by ${changes.errorRate.toFixed(2)}%`);
    }
    
    if (changes.memoryUsage > THRESHOLDS.memoryUsage) {
        regressions.push(`Memory usage increased by ${changes.memoryUsage.toFixed(2)}%`);
    }
    
    return regressions;
}

function main() {
    if (process.argv.length !== 4) {
        console.error('Usage: node compare-benchmarks.js <previous-file> <current-file>');
        process.exit(1);
    }

    const previousFile = process.argv[2];
    const currentFile = process.argv[3];

    try {
        const previous = JSON.parse(fs.readFileSync(previousFile, 'utf8'));
        const current = JSON.parse(fs.readFileSync(currentFile, 'utf8'));

        // Calculate changes for each metric
        const changes = {
            messageRate: calculateChange(
                current.profiles.stress.metrics.messagesPerSecond,
                previous.profiles.stress.metrics.messagesPerSecond
            ),
            latency: calculateChange(
                current.profiles.stress.metrics.averageLatency,
                previous.profiles.stress.metrics.averageLatency
            ),
            errorRate: calculateChange(
                current.profiles.stress.metrics.errorRate,
                previous.profiles.stress.metrics.errorRate
            ),
            memoryUsage: calculateChange(
                current.profiles.stress.metrics.memoryUsage,
                previous.profiles.stress.metrics.memoryUsage
            )
        };

        // Analyze for regressions
        const regressions = analyzeRegression(changes);
        const hasRegression = regressions.length > 0;

        // Format summary
        let summary = '';
        if (hasRegression) {
            summary = '### Performance Regressions Detected\n\n' +
                     regressions.map(r => `- ${r}`).join('\n');
        } else {
            summary = '### No Significant Performance Regressions\n\n' +
                     'All metrics are within acceptable thresholds.';
        }

        // Format changes for display
        const formattedChanges = Object.entries(changes).map(([metric, change]) => ({
            metric,
            value: formatChange(change, metric)
        }));

        // Output results as JSON
        const result = {
            hasRegression,
            summary,
            changes: Object.fromEntries(
                formattedChanges.map(({metric, value}) => [metric, value])
            ),
            thresholds: THRESHOLDS,
            timestamp: new Date().toISOString()
        };

        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('Error comparing benchmarks:', error.message);
        process.exit(1);
    }
}

main();