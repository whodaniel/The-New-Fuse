# Automated Component Analysis

## Overview
The automated component analysis runs daily to track changes in component usage across the codebase. It helps identify trends in component usage and potential areas for cleanup or consolidation.

## Schedule
- Runs daily at midnight
- Keeps 90 days of historical data
- Stores results in Redis for fast retrieval

## Results and Metrics
The analysis tracks several key metrics:

- Total component count
- Number of potentially unused components
- Percentage of unused components
- Day-over-day changes in these metrics

## Trends Analysis
The system automatically calculates trends over time:

- Component growth/reduction rate
- Changes in unused component percentage
- Historical comparisons (7-day, 30-day, 90-day)

## Accessing Results

### Via API
```typescript
// Get latest results
const latest = await componentAnalysisStorage.getLatestResults();

// Get historical data
const history = await componentAnalysisStorage.getHistory(30); // Last 30 days

// Get trends
const trends = await componentAnalysisStorage.getTrends();
```

### Via Task System
```typescript
const task = await taskService.createTask({
  type: 'component-analysis',
  name: 'Manual Component Analysis',
  priority: 'medium'
});

const results = await taskService.executeTask(task.id);
```

## Configuration
The analysis schedule can be modified in `packages/core/src/task/config/component-analysis-schedule.ts`.

Default schedule:
```typescript
timing: {
  cron: '0 0 * * *' // Daily at midnight
}
```

## Storage
Results are stored in Redis using a sorted set:
- Key: `component-analysis:history`
- Score: Timestamp
- Value: JSON-encoded analysis results
- Retention: 90 days