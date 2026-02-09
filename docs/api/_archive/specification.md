# API Specification

> **IMPORTANT**: This document is now superseded by the [Master Information Architecture](docs/MASTER_INFORMATION_ARCHITECTURE.md) document which serves as the single source of truth for all data structure standards and API patterns.

Please refer to the [Master Information Architecture](docs/MASTER_INFORMATION_ARCHITECTURE.md) section "Implementation Guidelines > Data Structure Standards" for the current API specifications and data structure standards.

This document will be maintained only for historical reference.

# Monitoring Endpoints

## GET /monitoring/memory
Fetch memory store items and overall statistics.

Response 200:
```json
{
  "items": [
    { "id": string, "content": string, "embedding": number[], "metadata": object, "timestamp": string },
    ...
  ],
  "stats": { "totalItems": number, "hitRate": number }
}
```

## GET /monitoring/metrics
Fetch custom metrics including step execution timings and memory metrics.

Response 200:
```json
{
  "stepMetrics": [
    { "nodeId": string, "duration": number, "success": boolean },
    ...
  ],
  "memoryMetrics": { "totalItems": number, "hitRate": number }
}
```