---
description: Sync n8n workflows from GitHub repositories
---

# N8N Workflow Sync

Sync n8n workflows from community repositories (Zie619/n8n-workflows, enescingoz/awesome-n8n-templates, Danitilahun/n8n-workflow-templates).

## Usage

This command triggers a sync operation to fetch the latest workflows from all configured GitHub repositories.

## What it does

1. Clones or updates local copies of the workflow repositories
2. Scans for JSON workflow files
3. Parses and validates each workflow
4. Categorizes workflows automatically
5. Updates the workflow registry
6. Saves to persistent storage

## API Endpoint

Make a POST request to `/api/workflows/n8n/sync`

## Expected Response

- Total workflows imported
- Breakdown by category
- Breakdown by source repository
- Any errors encountered during sync
- Last sync timestamp

## Notes

- The sync operation may take several minutes depending on network speed
- Workflows are cached locally for faster subsequent searches
- The registry is automatically updated with the latest workflows
