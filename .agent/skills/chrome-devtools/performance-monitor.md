# Chrome DevTools Performance Monitor

**Slash Command**: `/performance-trace` or `/devtools-perf`

**Category**: Performance Analysis & Optimization

**Compatible With**: Claude Code, Gemini Antigravity, Any MCP-enabled AI assistant

---

## Purpose

Advanced performance monitoring and analysis using Chrome DevTools Performance Profiler. Records execution traces, analyzes metrics like LCP (Largest Contentful Paint), TBT (Total Blocking Time), CLS (Cumulative Layout Shift), and provides AI-powered performance insights for web applications.

## Prerequisites

### MCP Server Configuration

Add to your MCP config file:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

---

## Available Tools

### 1. Start Performance Trace

**Tool Name**: `performance_start_trace`

**Purpose**: Begin recording a performance trace of webpage execution

**Parameters**:
- `autoStop` (required, boolean): Automatically stop trace after page load completes
- `reload` (required, boolean): Reload the page before starting trace (recommended for accurate cold-start metrics)

**Example Usage**:
```markdown
Agent: "Start a performance trace with page reload to measure initial load time"

Tool Call:
{
  "name": "performance_start_trace",
  "arguments": {
    "autoStop": true,
    "reload": true
  }
}
```

**Use Cases**:
- Measure page load performance (cold start)
- Analyze runtime performance without reload
- Capture user interaction traces
- Record animation and rendering performance

---

### 2. Stop Performance Trace

**Tool Name**: `performance_stop_trace`

**Purpose**: Stop the active performance trace and retrieve results

**Parameters**: None

**Returns**:
- `insightSetId`: Unique identifier for this trace
- `insights`: Array of performance insights detected
- `metrics`: Core Web Vitals and other performance metrics

**Example Usage**:
```markdown
Agent: "Stop the performance trace and analyze the results"

Tool Call:
{
  "name": "performance_stop_trace",
  "arguments": {}
}
```

**Returned Data Includes**:
- **Core Web Vitals**: LCP, FID, CLS
- **Load Metrics**: DOMContentLoaded, Load Event, First Paint
- **Runtime Metrics**: Long Tasks, JavaScript execution time
- **Rendering Metrics**: Layout shifts, paint events
- **Network Timing**: Resource load times

---

### 3. Analyze Performance Insight

**Tool Name**: `performance_analyze_insight`

**Purpose**: Deep-dive into a specific performance insight from trace results

**Parameters**:
- `insightName` (required, string): Name of the insight to analyze
- `insightSetId` (required, string): The trace ID from `performance_stop_trace`

**Common Insight Names**:
- `LargestContentfulPaint` - LCP timing and element
- `LayoutShift` - CLS score and affected elements
- `LongTask` - JavaScript blocking the main thread
- `RenderBlocking` - CSS/JS blocking first paint
- `SlowNetworkRequest` - Slow resource loads

**Example Usage**:
```markdown
Agent: "Analyze the Largest Contentful Paint insight from trace abc123"

Tool Call:
{
  "name": "performance_analyze_insight",
  "arguments": {
    "insightName": "LargestContentfulPaint",
    "insightSetId": "abc123"
  }
}
```

**Returned Details**:
- Root cause of the issue
- Affected elements and resources
- Timing breakdown
- Actionable recommendations

---

## Workflow Examples

### Example 1: Analyze Page Load Performance

```markdown
**User Request**: "My homepage is loading slowly. Find out why."

**Agent Workflow**:

1. Start performance trace with reload:
   Tool: performance_start_trace({ autoStop: true, reload: true })

2. Wait for trace to complete automatically

3. Stop trace and get results:
   Tool: performance_stop_trace()

   Response:
   {
     "insightSetId": "trace-001",
     "metrics": {
       "LCP": 4.2,  // ❌ Bad (should be < 2.5s)
       "CLS": 0.15, // ⚠️ Needs improvement (should be < 0.1)
       "TBT": 850   // ❌ Bad (should be < 300ms)
     },
     "insights": [
       "LargestContentfulPaint",
       "RenderBlocking",
       "LayoutShift"
     ]
   }

4. Analyze each insight:

   Tool: performance_analyze_insight({
     insightName: "LargestContentfulPaint",
     insightSetId: "trace-001"
   })

   Response:
   "LCP element: <img src='hero.jpg'> (2.8MB unoptimized image)
    Loaded at: 4.2s
    Recommendation: Compress image, use WebP format, add loading='lazy'"

   Tool: performance_analyze_insight({
     insightName: "RenderBlocking",
     insightSetId: "trace-001"
   })

   Response:
   "Blocking resources:
    - /css/styles.css (1.2MB, blocks for 890ms)
    - /js/analytics.js (450KB, blocks for 320ms)
    Recommendation: Use async/defer, split CSS into critical and non-critical"

5. Verify with console diagnostics:
   Tool: evaluate_script({
     function: "performance.getEntriesByType('resource').filter(r => r.duration > 1000)"
   })

**Agent Response**:
"Performance Analysis Complete:

🔴 **Critical Issues**:
1. **Slow LCP (4.2s)**: Hero image is 2.8MB unoptimized
   - Fix: Compress to WebP, reduce to ~200KB

2. **High TBT (850ms)**: JavaScript blocking main thread
   - Fix: Use code splitting, defer non-critical scripts

3. **Poor CLS (0.15)**: Header shifts after font loads
   - Fix: Use font-display: optional, reserve space for dynamic content

📊 **Metrics Comparison**:
- Current LCP: 4.2s → Target: <2.5s (67% slower)
- Current TBT: 850ms → Target: <300ms (183% slower)
- Current CLS: 0.15 → Target: <0.1 (50% worse)

**Priority Actions**:
1. Optimize hero.jpg (will improve LCP by ~1.5s)
2. Defer analytics.js (will reduce TBT by ~320ms)
3. Add font-display CSS (will eliminate layout shift)"
```

### Example 2: Runtime Performance Monitoring

```markdown
**User Request**: "The dashboard gets janky when scrolling. Find the bottleneck."

**Agent Workflow**:

1. Navigate to dashboard:
   Tool: navigate_page({ url: "http://localhost:3000/dashboard" })

2. Start trace WITHOUT reload (to capture runtime behavior):
   Tool: performance_start_trace({ autoStop: false, reload: false })

3. Simulate user interaction:
   Tool: evaluate_script({
     function: "window.scrollTo({top: 2000, behavior: 'smooth'})"
   })

4. Wait for scroll to complete:
   Tool: wait_for({ text: "Footer", timeout: 5000 })

5. Stop trace:
   Tool: performance_stop_trace()

   Response:
   {
     "insightSetId": "trace-002",
     "insights": [
       "LongTask",
       "LayoutShift",
       "ForcedReflow"
     ]
   }

6. Analyze Long Task:
   Tool: performance_analyze_insight({
     insightName: "LongTask",
     insightSetId: "trace-002"
   })

   Response:
   "Long task detected: 547ms
    Source: dashboard.js:updateCharts()
    Cause: Re-rendering 50 chart elements on scroll
    Recommendation: Use virtual scrolling, debounce scroll handler"

7. Check for forced reflows:
   Tool: performance_analyze_insight({
     insightName: "ForcedReflow",
     insightSetId: "trace-002"
   })

   Response:
   "Forced reflow triggered 23 times during scroll
    Cause: Reading offsetHeight immediately after DOM changes
    Recommendation: Batch DOM reads, use requestAnimationFrame"

**Agent Response**:
"Scroll Performance Issues Found:

🐌 **Jank Root Cause**:
- 547ms long task blocking main thread during scroll
- Function: `updateCharts()` in dashboard.js:142
- Re-rendering 50 SVG chart elements on every scroll event

⚡ **Optimization Recommendations**:

1. **Debounce scroll handler** (immediate fix):
   ```javascript
   const debouncedUpdate = debounce(updateCharts, 150);
   window.addEventListener('scroll', debouncedUpdate);
   ```

2. **Implement virtual scrolling** (best practice):
   - Only render visible chart elements
   - Expected improvement: 80% reduction in paint time

3. **Fix forced reflows** (performance leak):
   - Batch DOM reads before writes
   - Use CSS transforms instead of layout properties

**Expected Results**:
- Scroll FPS: 15fps → 60fps
- Long task duration: 547ms → <50ms
- Jank eliminated ✅"
```

### Example 3: Before/After Performance Comparison

```markdown
**User Request**: "I optimized the images. Verify the performance improvement."

**Agent Workflow**:

1. Run BEFORE trace:
   Tool: performance_start_trace({ autoStop: true, reload: true })
   Tool: performance_stop_trace()

   Save metrics: { LCP: 4.2s, TBT: 850ms, CLS: 0.15 }

2. User deploys optimized version

3. Run AFTER trace:
   Tool: navigate_page({ url: "same-url", ignoreCache: true })
   Tool: performance_start_trace({ autoStop: true, reload: true })
   Tool: performance_stop_trace()

   New metrics: { LCP: 1.8s, TBT: 420ms, CLS: 0.08 }

4. Analyze improvements:
   Tool: performance_analyze_insight({
     insightName: "LargestContentfulPaint",
     insightSetId: "trace-after"
   })

5. Generate comparison report:
   Tool: evaluate_script({
     function: `{
       before: ${beforeMetrics},
       after: ${afterMetrics},
       improvement: {
         lcp: ((4.2 - 1.8) / 4.2 * 100).toFixed(1) + '%',
         tbt: ((850 - 420) / 850 * 100).toFixed(1) + '%',
         cls: ((0.15 - 0.08) / 0.15 * 100).toFixed(1) + '%'
       }
     }`
   })

**Agent Response**:
"Performance Optimization Results:

✅ **Improvements Verified**

📊 **Metrics Comparison**:

| Metric | Before | After | Improvement | Status |
|--------|--------|-------|-------------|--------|
| LCP    | 4.2s   | 1.8s  | 57% faster  | ✅ Good |
| TBT    | 850ms  | 420ms | 51% faster  | ⚠️ Needs work |
| CLS    | 0.15   | 0.08  | 47% better  | ✅ Good |

🎯 **Core Web Vitals Score**:
- Before: 0/3 passing
- After: 2/3 passing

**What Improved**:
1. ✅ LCP now passes (1.8s < 2.5s threshold)
2. ✅ CLS now passes (0.08 < 0.1 threshold)
3. ⚠️ TBT still needs work (420ms > 300ms threshold)

**Remaining Issues**:
- TBT is still elevated due to large JavaScript bundle
- Recommendation: Implement code splitting to reduce TBT below 300ms

**Overall**: Performance improved significantly! 2 out of 3 Core Web Vitals now passing."
```

---

## Advanced Performance Patterns

### Pattern 1: Continuous Performance Monitoring

```javascript
// Setup continuous monitoring
const monitor = async () => {
  const traces = [];

  for (let i = 0; i < 5; i++) {
    await performance_start_trace({ autoStop: true, reload: true });
    const result = await performance_stop_trace();
    traces.push(result.metrics);

    // Wait 30 seconds between traces
    await new Promise(resolve => setTimeout(resolve, 30000));
  }

  // Calculate median metrics
  return calculateMedian(traces);
}
```

### Pattern 2: A/B Performance Testing

```javascript
// Test two variants
const variantA = await testPerformance("http://site.com?variant=A");
const variantB = await testPerformance("http://site.com?variant=B");

const comparison = {
  winner: variantA.LCP < variantB.LCP ? "A" : "B",
  difference: Math.abs(variantA.LCP - variantB.LCP),
  recommendation: variantA.LCP < variantB.LCP ?
    "Deploy variant A" : "Deploy variant B"
}
```

### Pattern 3: Performance Budget Enforcement

```javascript
// Define performance budgets
const budgets = {
  LCP: 2.5,  // seconds
  CLS: 0.1,  // score
  TBT: 300   // milliseconds
};

// Run trace and check against budgets
const trace = await performance_stop_trace();
const violations = Object.entries(budgets)
  .filter(([metric, budget]) => trace.metrics[metric] > budget)
  .map(([metric, budget]) => ({
    metric,
    budget,
    actual: trace.metrics[metric],
    severity: calculateSeverity(trace.metrics[metric], budget)
  }));

if (violations.length > 0) {
  throw new Error(`Performance budget violated: ${JSON.stringify(violations)}`);
}
```

### Pattern 4: Real User Monitoring (RUM) Emulation

```javascript
// Emulate real user conditions
await emulate({
  networkConditions: "Slow-4G",
  cpuThrottlingRate: 4  // 4x CPU slowdown
});

await performance_start_trace({ autoStop: true, reload: true });
const rum_metrics = await performance_stop_trace();

// Compare to lab conditions
const comparison = {
  lab: lab_metrics,
  rum: rum_metrics,
  degradation: calculateDegradation(lab_metrics, rum_metrics)
}
```

---

## Performance Metrics Explained

### Core Web Vitals

#### Largest Contentful Paint (LCP)
- **Measures**: When the largest visible element renders
- **Good**: < 2.5 seconds
- **Needs Improvement**: 2.5 - 4.0 seconds
- **Poor**: > 4.0 seconds
- **Affects**: User perception of load speed

#### Cumulative Layout Shift (CLS)
- **Measures**: Visual stability (unexpected layout shifts)
- **Good**: < 0.1
- **Needs Improvement**: 0.1 - 0.25
- **Poor**: > 0.25
- **Affects**: User experience, accidental clicks

#### Total Blocking Time (TBT)
- **Measures**: Time main thread is blocked from responding
- **Good**: < 300 milliseconds
- **Needs Improvement**: 300 - 600 milliseconds
- **Poor**: > 600 milliseconds
- **Affects**: Interactivity, responsiveness

### Other Important Metrics

#### First Contentful Paint (FCP)
- When first text or image renders
- Target: < 1.8 seconds

#### Time to Interactive (TTI)
- When page becomes fully interactive
- Target: < 3.8 seconds

#### Speed Index
- How quickly content is visually displayed
- Target: < 3.4 seconds

---

## Emulation Tools

### CPU Throttling

```javascript
// Emulate slower CPU (useful for testing on low-end devices)
emulate({
  cpuThrottlingRate: 4  // 4x slowdown (simulates low-end mobile)
})

// Test with throttling
await performance_start_trace({ autoStop: true, reload: true });
const throttled_metrics = await performance_stop_trace();
```

### Network Emulation

```javascript
// Emulate slow network
emulate({
  networkConditions: "Slow-3G"
  // Options: "Slow-3G", "Fast-3G", "Slow-4G", "Fast-4G", "Offline"
})

// Test with slow network
await performance_start_trace({ autoStop: true, reload: true });
const slow_network_metrics = await performance_stop_trace();
```

### Combined Emulation

```javascript
// Emulate real-world conditions (slow device + slow network)
emulate({
  cpuThrottlingRate: 6,         // Very slow CPU
  networkConditions: "Slow-3G"  // Slow network
})
```

---

## Best Practices

### 1. Always Reload for Accurate Cold Start Metrics

```javascript
// ✅ Correct: Reload enabled
performance_start_trace({ autoStop: true, reload: true })

// ❌ Incorrect: No reload (gets cached performance)
performance_start_trace({ autoStop: false, reload: false })
```

### 2. Use autoStop for Load Performance

```javascript
// For page load: Let trace auto-stop
performance_start_trace({ autoStop: true, reload: true })

// For runtime: Manual control
performance_start_trace({ autoStop: false, reload: false })
// ... user interactions ...
performance_stop_trace()
```

### 3. Run Multiple Traces for Reliable Data

```javascript
// Take median of 3-5 runs
const traces = [];
for (let i = 0; i < 5; i++) {
  await performance_start_trace({ autoStop: true, reload: true });
  traces.push(await performance_stop_trace());
}

const median_lcp = calculateMedian(traces.map(t => t.metrics.LCP));
```

### 4. Clear Cache Between Tests

```javascript
// Navigate with cache disabled
navigate_page({ url: "http://site.com", ignoreCache: true })
```

---

## Integration with Console Debugging

```markdown
**Combined Workflow**: Performance + Console Analysis

1. Start performance trace:
   performance_start_trace({ autoStop: true, reload: true })

2. Monitor console during load:
   list_console_messages({ types: ["warning", "error"] })

3. Stop trace:
   performance_stop_trace()

4. Correlate console warnings with performance insights:
   - Console: "Image loaded without dimensions"
   - Performance: CLS score of 0.23
   - Root cause: Layout shift from image loading

5. Verify fix:
   evaluate_script({
     function: "document.querySelectorAll('img:not([width])').length"
   })
```

---

## Troubleshooting

### Issue: "Trace times out or never completes"

**Solution**: Increase timeout or use manual stop:

```javascript
// If autoStop fails, use manual control
performance_start_trace({ autoStop: false, reload: true })

// Wait for specific condition
wait_for({ text: "Page loaded", timeout: 30000 })

// Then stop manually
performance_stop_trace()
```

### Issue: "Metrics vary widely between runs"

**Solution**: This is normal. Use median of multiple runs:

```javascript
// Run 5 times and take median
const runs = 5;
const results = await Promise.all(
  Array(runs).fill().map(() => runPerformanceTrace())
);

const median_metrics = {
  LCP: median(results.map(r => r.LCP)),
  CLS: median(results.map(r => r.CLS)),
  TBT: median(results.map(r => r.TBT))
};
```

### Issue: "No insights returned"

**Solution**: The page may be too fast or insights disabled:

```javascript
// Check raw performance data
evaluate_script({
  function: `JSON.stringify(performance.timing)`
})

// Or use Performance Observer API
evaluate_script({
  function: `
    const entries = performance.getEntriesByType('navigation');
    JSON.stringify(entries[0])
  `
})
```

---

## Related Skills

- `/console-debug` - Console error and warning analysis
- `/network-debug` - Network request performance
- `/browser-automate` - Automated user interaction testing
- `/screenshot-debug` - Visual regression testing

---

## References

- [Web Vitals Documentation](https://web.dev/vitals/)
- [Chrome DevTools Performance Guide](https://developer.chrome.com/docs/devtools/performance/)
- [Chrome DevTools MCP Server](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- [Performance APIs](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API)

---

## Version

- **Skill Version**: 1.0.0
- **MCP Server**: chrome-devtools-mcp@latest
- **Last Updated**: 2026-01-10
- **Maintainer**: The New Fuse Team
