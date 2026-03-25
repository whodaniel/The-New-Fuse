# Zo Feature Matrix (TNF Mapping)

Source: `docs/competitive/zo-playwright-crawl-20260325/crawl-summary.json` (captured on 2026-03-25).

| Zo Feature | TNF Route | Status | Notes |
| --- | --- | --- | --- |
| Home | `/dashboard` | Implemented | Core dashboard surface |
| Chats | `/chat` and `/chats` | Implemented | Realtime chat operations |
| Channels | `/channels` | Implemented | Alias to live TNF chat workspace |
| Files | `/files` | Implemented | Dedicated Files Workspace with indexed corpus search |
| Automations | `/automations` | Implemented | Workflow automation surfaces |
| Space | `/space` | Implemented | Space control with routed projects and domain management |
| Skills | `/skills` | Implemented | Resources marketplace skills surface |
| Tools | `/tools` | Implemented | Alias to live resources/tool catalog |
| Integrations | `/integrations` | Implemented | Alias to live resources integration catalog |
| Models | `/models` | Implemented | Alias to API/model settings |
| Hosting | `/hosting` | Implemented | Hosting control center with DB-backed domain operations |
| Datasets | `/datasets` | Implemented | Datasets workbench with indexed corpus + export |
| System | `/system` | Implemented | System health/observability surface |
| Terminal | `/terminal` | Implemented | Terminal and graph operations surface |
| Billing | `/billing` | Implemented | Membership + billing rails |
| Bookmarks | `/bookmarks` | Implemented | Workspace-scoped DB-backed bookmarks (import/export supported) |
| Settings | `/settings` | Implemented | Existing TNF settings stack |

Current parity dashboard route: `/zo-parity`
