# Utility Functions for The New Fuse VS Code Extension

This directory contains utility functions that are used throughout the VS Code extension.

## Overview

As of May 15, 2025, this directory has been refactored to consolidate utility functions. Previously separate utility files have been integrated directly into the relevant service and component classes for better cohesion and organization.

## Current Utilities

### `code-analyzer.ts`

A utility for advanced code analysis that extracts semantic information from code in the editor. It provides:

- Document and selection analysis
- Code block extraction
- Symbol information gathering
- Import and dependency analysis
- Recommendations for code improvements

### `error-utils.ts`

Error handling utilities for consistent error management across the extension:

- Error message extraction
- Error classification
- User-friendly error messages

### `logging.ts`

Logging utilities for consistent logging throughout the extension:

- Log level management
- Structured logging
- Module-specific loggers

### `performance-utils.ts`

Performance monitoring utilities:

- Function execution time tracking
- Performance benchmarking
- Resource usage monitoring

## Project Structure Changes

The following utilities have been refactored and their functionality integrated into relevant service and component classes:

- `fs-utils.ts/js`: File system utilities now use Node's `fs/promises` directly
- `webview-utils.ts/js`: WebView functionality integrated into individual view providers
- `uri-utils.ts/js`: URI handling now uses VS Code's `vscode.Uri` methods directly
- `vscode-utils.ts/js`: VS Code-specific utilities integrated into respective components
- `index.ts/js`: Barrel exports removed in favor of direct imports

## Best Practices

When working with utilities:

1. Keep utility functions focused on a single responsibility
2. Avoid circular dependencies between utility files
3. Use TypeScript for type safety and better documentation
4. Include comprehensive JSDoc comments for all public functions
5. Write unit tests for utility functions
6. Consider performance implications, especially for frequently called utilities
