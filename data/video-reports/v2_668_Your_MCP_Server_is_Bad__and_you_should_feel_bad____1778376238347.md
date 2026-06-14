# Video Analysis Report

## Metadata
- **Video**: Your MCP Server is Bad (and you should feel bad) - Jeremiah Lowin, Prefect
- **Index**: #668
- **URL**: https://www.youtube.com/watch?v=96G7FLab8xc
- **Duration**: 54:32
- **Processed**: 2026-05-10T01:23:58.347Z

---

## Summary
Technical talk on MCP (Model Context Protocol) server design by Jeremiah Lowin, founder of Prefect and creator of FastMCP. Covers common anti-patterns in MCP server development, emphasizing product-oriented design over API wrappers, with specific code examples and best practices for argument flattening and typed interfaces.

## 🦾 Visual Intelligence
- **5:33**: Key philosophical slide on product vs API design - Slide: 'Humans don't use APIs. Humans use products.'
- **13:27**: Reference materials for MCP server design - Two browser windows showing 'Block's Playbook for Designing MCP Servers' and GitHub blog 'How to build secure and scalable remote MCP servers'
- **13:27**: Code anti-pattern example - Python code showing @mcp.tool decorators with get_user_by_email, list_orders_v2, get_shipping_details - labeled as 'The REST Wrapper Starting Point'
- **13:32**: Best practice slide for argument design - Slide: 'Flatten your arguments' showing The Trap (config: dict, mystery meat, over-configuration) vs The Fix (top-level primitives, typed enums, strong defaults)
