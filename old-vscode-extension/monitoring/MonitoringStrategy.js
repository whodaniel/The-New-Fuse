"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.implementationPlan = exports.recommendedStrategy = void 0;
exports.shouldImplementNatively = shouldImplementNatively;
/**
 * The recommended monitoring strategy for The New Fuse platform.
 */
exports.recommendedStrategy = {
    nativeImplementations: {
        highPriority: [
            "Real-time Agent Activity Dashboard - Showcase active agents and their tool usage in the SaaS UI",
            "Enhanced Tool Usage Metrics - Track tool invocations, success rates, and performance across all agents",
            "Unified Trace View - Show interactions between multiple agents in a single view/timeline",
            "Basic Token/Cost Tracking - Implement token counting and basic usage reporting"
        ],
        mediumPriority: [
            "Session Replay - Capture and replay agent interaction sequences",
            "Custom Event Tracking - Allow developers to emit and track custom events",
            "Agent Performance Benchmarks - Compare agent performance across different workloads",
            "Redis-backed Event Queue - Implement Redis-based event buffering for better throughput"
        ],
        lowPriority: [
            "Advanced Analytics Dashboard - Complex visualizations and reporting",
            "ML-powered Anomaly Detection - Identify unusual agent behavior patterns",
            "Cross-project Analytics - Compare metrics across multiple Fuse deployments",
            "Historical Data Warehousing - Long-term storage and analysis of monitoring data"
        ]
    },
    langfuseIntegration: {
        immediateUse: [
            "Long-term Analytics Storage - Leverage Langfuse's S3/ClickHouse infrastructure",
            "Advanced Cost Analytics - Use Langfuse's token counting and cost projections",
            "SQL Analytics Engine - Allow users to run custom SQL queries on their data",
            "Data Export/Import - Utilize Langfuse's data portability features",
            "Custom Dashboards - Allow users to create custom monitoring dashboards"
        ],
        potentialReplacement: [
            "Evaluation Workflows - Currently use Langfuse's, but build native version later",
            "Team Collaboration Features - Delegate to Langfuse initially",
            "Alerting System - Use Langfuse alerts before building native capability",
            "Advanced Prompt Analysis - Use Langfuse's prompt analysis tools initially"
        ]
    }
};
/**
 * Helper function to determine if a feature should be implemented natively
 * or delegated to Langfuse based on the recommended strategy.
 */
function shouldImplementNatively(featureName) {
    const allNative = [
        ...exports.recommendedStrategy.nativeImplementations.highPriority,
        ...exports.recommendedStrategy.nativeImplementations.mediumPriority,
        ...exports.recommendedStrategy.nativeImplementations.lowPriority
    ];
    const allLangfuse = [
        ...exports.recommendedStrategy.langfuseIntegration.immediateUse,
        ...exports.recommendedStrategy.langfuseIntegration.potentialReplacement
    ];
    return allNative.some(f => f.includes(featureName)) &&
        !allLangfuse.some(f => f.includes(featureName));
}
/**
 * Implementation plan for integrating monitoring across the full Fuse stack
 */
exports.implementationPlan = {
    vsCodeExtension: {
        current: [
            "Basic agent monitoring via AgentMonitor",
            "LLM usage tracking via LLMMonitoringClient",
            "Native tracing via FuseMonitoringClient",
            "Admin control panel webview",
            "Monitoring settings webview"
        ],
        next: [
            "Enhanced tool call tracking",
            "Local persistent storage via SQLite",
            "Unified agent dashboard improvements",
            "Token counting for all LLM providers"
        ]
    },
    saasBackend: {
        current: [
            "Basic Redis-based event storage",
            "REST API for monitoring data submission",
            "PostgreSQL schema for event storage"
        ],
        next: [
            "Dedicated telemetry-worker service",
            "Redis-based event buffering queue",
            "Optimized PostgreSQL schema with time-series capabilities",
            "Basic monitoring dashboard in web UI"
        ]
    },
    langfuseBridge: {
        current: [
            "Optional Langfuse client in VS Code extension",
            "Basic trace/span/generation mapping"
        ],
        next: [
            "Server-side Langfuse integration",
            "Two-way data sync between Fuse and Langfuse",
            "Enhanced Langfuse SDK integration",
            "Langfuse dashboard embedding in Fuse web UI"
        ]
    }
};
//# sourceMappingURL=MonitoringStrategy.js.map