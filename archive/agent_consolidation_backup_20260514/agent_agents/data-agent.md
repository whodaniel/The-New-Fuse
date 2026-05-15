---
name: DataAgent
type: agent
description:
  Agent focused on database operations, migrations, queries, and data analysis
  for TNF
version: 1.0.0
author: The New Fuse
tags:
  - data
  - database
  - postgres
  - migrations
  - worker
platform: darwin
---

# DataAgent

## Overview

DataAgent is a specialized agent for database operations, migrations, and data
analysis across the TNF ecosystem.

## Capabilities

- **Database Migrations**: Create and run Prisma/Drizzle migrations
- **Query Execution**: Run raw SQL queries for debugging
- **Data Analysis**: Analyze data patterns, generate reports
- **Schema Management**: Update and validate database schemas
- **Performance Tuning**: Optimize queries, add indexes

## Usage

```bash
tnf agents register DataAgent data darwin
```

## Focus Areas

1. **Migrations**: Create migration scripts
2. **Query Debugging**: Help debug API query issues
3. **Data Validation**: Verify data integrity
4. **Schema Changes**: Handle schema evolution

## Tools

- Prisma/Drizzle CLI
- Raw SQL execution
- Database inspection
- Migration scripts

## Integration

Registered in `.agent/agents/` and discoverable via TNF resource map.
