# The New Fuse - GUI Components and Pages Documentation

This document provides a comprehensive overview of all GUI components and pages in The New Fuse application. It serves as a reference for developers to understand the application structure and find specific components.

## Table of Contents

- [Main Pages](#main-pages)
  - [Authentication Pages](#authentication-pages)
  - [Main Application Pages](#main-application-pages)
  - [Admin Pages](#admin-pages)
  - [Dashboard Pages](#dashboard-pages)
  - [Workspace Pages](#workspace-pages)
  - [Settings Pages](#settings-pages)
  - [Legal Pages](#legal-pages)
  - [Utility Pages](#utility-pages)
- [Core UI Components](#core-ui-components)
  - [Layout Components](#layout-components)
  - [Base UI Components](#base-ui-components)
- [Feature-Specific Components](#feature-specific-components)
  - [Agent Components](#agent-components)
  - [Chat Components](#chat-components)
  - [Workflow Components](#workflow-components)
  - [Dashboard Components](#dashboard-components)
  - [Admin Components](#admin-components)
  - [Prompt/AI Components](#promptai-components)
  - [Utility Components](#utility-components)
  - [Knowledge/Memory Components](#knowledgememory-components)
  - [Onboarding Components](#onboarding-components)

## Main Pages

### Authentication Pages
| Page | Path | Description |
|------|------|-------------|
| Login | `apps/frontend/src/pages/auth/Login.tsx` | User login page |
| Register | `apps/frontend/src/pages/auth/Register.tsx` | User registration page |
| Forgot Password | `apps/frontend/src/pages/auth/ForgotPassword.tsx` | Password recovery request page |
| Reset Password | `apps/frontend/src/pages/auth/ResetPassword.tsx` | Password reset page |
| SSO | `apps/frontend/src/pages/auth/SSO.tsx` | Single Sign-On authentication page |
| OAuth Callback | `apps/frontend/src/pages/auth/OAuthCallback.tsx` | OAuth authentication callback handler |
| Google Callback | `apps/frontend/src/pages/auth/GoogleCallback.tsx` | Google OAuth callback handler |

### Main Application Pages
| Page | Path | Description |
|------|------|-------------|
| Home | `apps/frontend/src/pages/Home.tsx` | Main landing page for authenticated users |
| Dashboard | `apps/frontend/src/pages/Dashboard.tsx` | Main dashboard with overview of activities |
| Landing Page | `apps/frontend/src/pages/LandingPage.tsx` | Public landing page for non-authenticated users |
| Analytics | `apps/frontend/src/pages/Analytics.tsx` | Analytics and metrics overview |
| Workspace Chat | `apps/frontend/src/pages/WorkspaceChat/index.tsx` | Collaborative workspace chat interface |
| AI Agent Portal | `apps/frontend/src/pages/AIAgentPortal/index.tsx` | Portal for AI agent management |
| Main | `apps/frontend/src/pages/Main/index.tsx` | Main application entry point |

### Admin Pages
| Page | Path | Description |
|------|------|-------------|
| Admin Dashboard | `apps/frontend/src/pages/Admin/Dashboard.tsx` | Admin overview dashboard |
| Admin Settings | `apps/frontend/src/pages/Admin/Settings.tsx` | Admin settings configuration |
| System Health | `apps/frontend/src/pages/Admin/SystemHealth.tsx` | System health monitoring |
| User Management | `apps/frontend/src/pages/Admin/Users.tsx` | User management interface |
| Workspace Management | `apps/frontend/src/pages/Admin/Workspaces.tsx` | Workspace management interface |
| Agent Skills | `apps/frontend/src/pages/Admin/Agents/skills.tsx` | Agent skills configuration |
| Experimental Features | `apps/frontend/src/pages/Admin/ExperimentalFeatures/features.tsx` | Experimental features management |
| Admin Layout | `apps/frontend/src/pages/Admin/AdminLayout.tsx` | Layout wrapper for admin pages |
| Admin Index | `apps/frontend/src/pages/Admin/index.tsx` | Admin section entry point |

### Dashboard Pages
| Page | Path | Description |
|------|------|-------------|
| Agents Dashboard | `apps/frontend/src/pages/dashboard/Agents.tsx` | Dashboard for agent management |
| Agent Details | `apps/frontend/src/pages/dashboard/agents/[id].tsx` | Individual agent details page |
| New Agent | `apps/frontend/src/pages/dashboard/agents/new.tsx` | Create new agent page |
| Dashboard Analytics | `apps/frontend/src/pages/dashboard/Analytics.tsx` | Analytics for dashboard activities |
| Dashboard Settings | `apps/frontend/src/pages/dashboard/Settings.tsx` | Dashboard settings configuration |
| Dashboard Index | `apps/frontend/src/pages/dashboard/index.tsx` | Dashboard section entry point |
| Agents Index | `apps/frontend/src/pages/dashboard/agents/index.tsx` | Agents listing page |

### Workspace Pages
| Page | Path | Description |
|------|------|-------------|
| Workspace Overview | `apps/frontend/src/pages/workspace/Overview.tsx` | Workspace overview page |
| Workspace Analytics | `apps/frontend/src/pages/workspace/Analytics.tsx` | Analytics for workspace activities |
| Workspace Members | `apps/frontend/src/pages/workspace/Members.tsx` | Workspace members management |
| Workspace Settings | `apps/frontend/src/pages/workspace/Settings.tsx` | Workspace settings configuration |
| Workspace Layout | `apps/frontend/src/pages/workspace/WorkspaceLayout.tsx` | Layout wrapper for workspace pages |
| Workspace Index | `apps/frontend/src/pages/workspace/index.tsx` | Workspace section entry point |

### Settings Pages
| Page | Path | Description |
|------|------|-------------|
| General Settings | `apps/frontend/src/pages/settings/General.tsx` | General application settings |
| Settings Index | `apps/frontend/src/pages/settings/index.tsx` | Settings section entry point |
| Embedding Preference | `apps/frontend/src/pages/GeneralSettings/EmbeddingPreference.tsx` | AI embedding model preferences |
| General Settings Index | `apps/frontend/src/pages/GeneralSettings/index.tsx` | General settings entry point |

### Legal Pages
| Page | Path | Description |
|------|------|-------------|
| Privacy Policy | `apps/frontend/src/pages/legal/PrivacyPolicy.tsx` | Privacy policy page |
| Terms of Service | `apps/frontend/src/pages/legal/TermsOfService.tsx` | Terms of service page |

### Utility Pages
| Page | Path | Description |
|------|------|-------------|
| 404 Not Found | `apps/frontend/src/pages/404.tsx` | 404 error page |
| Not Found | `apps/frontend/src/pages/NotFound.tsx` | Alternative 404 page |
| Unauthorized | `apps/frontend/src/pages/Unauthorized.tsx` | Unauthorized access page |
| Timeline Demo | `apps/frontend/src/pages/TimelineDemo.tsx` | Timeline feature demonstration |
| Graph Demo | `apps/frontend/src/pages/graph-demo.tsx` | Graph visualization demonstration |
| All Pages | `apps/frontend/src/pages/AllPages.tsx` | Page listing for development |

## Core UI Components

### Layout Components
| Component | Path | Description |
|-----------|------|-------------|
| Main Layout | `apps/frontend/src/components/MainLayout.tsx` | Main application layout |
| Root Layout | `packages/ui-components/src/layout/root-layout.tsx` | Root layout wrapper |
| App Layout | `packages/ui-components/src/layout/AppLayout.tsx` | Application layout structure |
| Workspace Layout | `apps/frontend/src/pages/workspace/WorkspaceLayout.tsx` | Layout for workspace pages |
| Admin Layout | `apps/frontend/src/pages/Admin/AdminLayout.tsx` | Layout for admin pages |
| Sidebar | `packages/ui-components/src/layout/Sidebar/index.tsx` | Navigation sidebar |
| Header | `packages/ui-components/src/layout/Header/index.tsx` | Application header |
| Footer | `packages/ui-components/src/layout/Footer/index.tsx` | Application footer |
| Navigation | `packages/ui-components/src/layout/Navigation/index.tsx` | Navigation component |
| Base Layout | `packages/ui-components/src/layout/BaseLayout/index.tsx` | Base layout structure |
| Nav Menu | `packages/ui-components/src/layout/nav-menu.tsx` | Navigation menu component |

### Base UI Components
| Component | Path | Description |
|-----------|------|-------------|
| Button | `packages/ui-components/src/core/button/ConsolidatedButton.tsx` | Consolidated button component |
| Card | `packages/ui-components/src/core/card/ConsolidatedCard.tsx` | Consolidated card component |
| Dialog/Modal | `packages/ui-components/src/core/dialog/ConsolidatedDialog.tsx` | Consolidated dialog/modal component |
| Input | `packages/ui-components/src/core/input/Input.tsx` | Input field component |
| Select | `packages/ui-components/src/core/select/Select.tsx` | Select dropdown component |
| Checkbox | `packages/ui-components/src/core/checkbox.tsx` | Checkbox component |
| Switch | `packages/ui-components/src/core/switch/index.tsx` | Toggle switch component |
| Dropdown Menu | `packages/ui-components/src/core/DropdownMenu/index.tsx` | Dropdown menu component |
| Toast | `packages/ui-components/src/core/toast/index.tsx` | Toast notification component |
| Tabs | `packages/ui-components/src/core/tabs.tsx` | Tabbed interface component |
| Avatar | `packages/ui-components/src/core/avatar.tsx` | User avatar component |
| Badge | `packages/ui-components/src/core/badge.tsx` | Badge indicator component |
| Form | `packages/ui-components/src/core/form.tsx` | Form component |
| Progress | `packages/ui-components/src/core/progress.tsx` | Progress indicator component |
| Slider | `packages/ui-components/src/core/slider.tsx` | Slider input component |
| Textarea | `packages/ui-components/src/core/textarea.tsx` | Multi-line text input component |
| Data Table | `packages/ui-components/src/core/data-table.tsx` | Data table component |
| Scroll Area | `packages/ui-components/src/core/scroll-area.tsx` | Scrollable container component |
| Loading Spinner | `packages/ui-components/src/core/LoadingSpinner.tsx` | Loading indicator component |
| Error Boundary | `packages/ui-components/src/core/ErrorBoundary/index.tsx` | Error handling component |

## Feature-Specific Components

### Agent Components
| Component | Path | Description |
|-----------|------|-------------|
| Agent Card | `apps/frontend/src/components/AgentCard.tsx` | Card displaying agent information |
| Agent Chat Room | `apps/frontend/src/components/AgentChatRoom.tsx` | Chat interface for agent interaction |
| Agent Creation Studio | `apps/frontend/src/components/AgentCreationStudio.tsx` | Interface for creating new agents |
| Agent Marketplace | `apps/frontend/src/components/AgentMarketplace.tsx` | Marketplace for discovering agents |
| Agent Workflow Manager | `apps/frontend/src/components/AgentWorkflowManager.tsx` | Tool for managing agent workflows |
| Agent Personality Customizer | `apps/frontend/src/components/agent-personality-customizer.tsx` | Tool for customizing agent personalities |
| Agent Selector | `apps/frontend/src/components/agent-selector.tsx` | Component for selecting agents |
| Agent Skill Marketplace | `apps/frontend/src/components/agent-skill-marketplace.tsx` | Marketplace for agent skills |
| Agent Training Arena | `apps/frontend/src/components/agent-training-arena.tsx` | Environment for training agents |
| Agent Network | `apps/frontend/src/components/agent-network.tsx` | Visualization of agent connections |
| Agent Details | `apps/frontend/src/components/agent-details.tsx` | Detailed agent information view |
| Agent Message | `apps/frontend/src/components/agent-message.tsx` | Agent message display component |
| Agent Collaboration Dashboard | `apps/frontend/src/components/agent-collaboration-dashboard.tsx` | Dashboard for agent collaboration |
| Agent Config Modal | `packages/features/agents/components/AgentConfigModal.tsx` | Modal for agent configuration |
| Agent Filters | `packages/features/agents/components/AgentFilters.tsx` | Filtering options for agents |
| Agent Form | `packages/features/agents/components/AgentForm/index.tsx` | Form for agent creation/editing |
| Agent List | `packages/features/agents/components/AgentList.tsx` | List of available agents |
| Agent Logs | `packages/features/agents/components/AgentLogs.tsx` | Agent activity logs |
| Agent Metrics | `packages/features/agents/components/AgentMetrics.tsx` | Performance metrics for agents |
| Agent Search | `packages/features/agents/components/AgentSearch.tsx` | Search interface for agents |
| Agent Settings | `packages/features/agents/components/AgentSettings.tsx` | Agent configuration settings |
| Agent Status | `packages/features/agents/components/AgentStatus.tsx` | Agent status indicator |
| Agent Tasks | `packages/features/agents/components/AgentTasks.tsx` | Task management for agents |

### Chat Components
| Component | Path | Description |
|-----------|------|-------------|
| Chat Room | `apps/frontend/src/components/ChatRoom.tsx` | Chat room interface |
| Chat Interface | `apps/frontend/src/components/chat/ChatInterface.tsx` | Main chat interface component |
| Chat Window | `apps/frontend/src/components/chat/ChatWindow.tsx` | Chat display window |
| Message Bubble | `apps/frontend/src/components/chat/MessageBubble.tsx` | Individual message display |
| Enhanced Chat Bubble | `apps/frontend/src/components/chat/EnhancedChatBubble.tsx` | Advanced message display with features |
| Typing Indicator | `apps/frontend/src/components/chat/TypingIndicator.tsx` | Indicator for typing activity |
| Message Thread | `apps/frontend/src/components/MessageThread/MessageThread.tsx` | Threaded message display |
| Message Search | `apps/frontend/src/components/MessageSearch/MessageSearch.tsx` | Search interface for messages |
| Chat Input | `packages/features/chat/ChatInput.tsx` | Input field for chat messages |
| Chat Message | `packages/features/chat/ChatMessage.tsx` | Message component for chat |
| Message Reactions | `packages/features/chat/components/MessageReactions.tsx` | Reaction controls for messages |
| Chat Context | `packages/features/chat/ChatContext.tsx` | Context provider for chat state |

### Workflow Components
| Component | Path | Description |
|-----------|------|-------------|
| Workflow Canvas | `apps/frontend/src/components/WorkflowEditor/WorkflowCanvas.tsx` | Canvas for workflow editing |
| Workflow Toolbar | `apps/frontend/src/components/WorkflowEditor/WorkflowToolbar/index.tsx` | Toolbar for workflow actions |
| Node Inspector | `apps/frontend/src/components/WorkflowEditor/NodeInspector/index.tsx` | Inspector for node properties |
| Node Library | `apps/frontend/src/components/WorkflowEditor/NodeLibrary/index.tsx` | Library of available nodes |
| Node Category | `apps/frontend/src/components/WorkflowEditor/NodeLibrary/NodeCategory.tsx` | Categorization for node types |
| Execution Overlay | `apps/frontend/src/components/WorkflowEditor/ExecutionOverlay/index.tsx` | Overlay for workflow execution |
| Dynamic Node | `apps/frontend/src/components/WorkflowEditor/components/DynamicNode.tsx` | Dynamic node component |
| Code Editor | `apps/frontend/src/components/WorkflowEditor/components/CodeEditor.tsx` | Code editing interface |
| Collection Editor | `apps/frontend/src/components/WorkflowEditor/components/CollectionEditor.tsx` | Collection data editor |
| Credential Selector | `apps/frontend/src/components/WorkflowEditor/components/CredentialSelector.tsx` | Credential selection interface |
| AI Processing Node | `apps/frontend/src/components/WorkflowEditor/nodes/AIProcessingNode.tsx` | Node for AI processing |
| HTTP Request Node | `apps/frontend/src/components/WorkflowEditor/nodes/HttpRequestNode.tsx` | Node for HTTP requests |
| Slack Node | `apps/frontend/src/components/WorkflowEditor/nodes/SlackNode.tsx` | Node for Slack integration |
| Workflow Editor | `apps/frontend/src/components/WorkflowEditor/index.tsx` | Main workflow editor component |
| Workflow Engine | `packages/ui-components/src/features/workflow/WorkflowEngine.tsx` | Engine for workflow execution |
| Workflow Controls | `packages/ui-components/src/features/workflow/components/WorkflowControls.tsx` | Controls for workflow execution |
| Workflow Error | `packages/ui-components/src/features/workflow/components/WorkflowError.tsx` | Error handling for workflows |
| Workflow Progress | `packages/ui-components/src/features/workflow/components/WorkflowProgress.tsx` | Progress indicator for workflows |
| Workflow Step Viewer | `packages/ui-components/src/features/workflow/components/WorkflowStepViewer.tsx` | Viewer for workflow steps |
| Workflow Visualizer | `packages/ui-components/src/features/workflow/components/WorkflowVisualizer.tsx` | Visualization of workflow |

### Dashboard Components
| Component | Path | Description |
|-----------|------|-------------|
| Performance Dashboard | `apps/frontend/src/components/PerformanceDashboard.tsx` | Dashboard for performance metrics |
| User Dashboard | `apps/frontend/src/components/UserDashboard.tsx` | User-specific dashboard |
| Moderation Dashboard | `apps/frontend/src/components/ModerationDashboard/ModerationDashboard.tsx` | Dashboard for content moderation |
| Agent Monitoring Dashboard | `apps/frontend/src/components/monitoring/AgentMonitoringDashboard.tsx` | Dashboard for agent monitoring |
| Dashboard | `packages/features/dashboard/components/Dashboard.tsx` | Main dashboard component |
| Dashboard Grid | `packages/features/dashboard/components/DashboardGrid.tsx` | Grid layout for dashboard |
| Dashboard Provider | `packages/features/dashboard/components/DashboardProvider.tsx` | Provider for dashboard state |
| Dashboard Root | `packages/features/dashboard/components/DashboardRoot.tsx` | Root component for dashboard |
| Chart Widget | `packages/features/dashboard/components/ChartWidget.tsx` | Widget for chart display |
| List Widget | `packages/features/dashboard/components/ListWidget.tsx` | Widget for list display |
| Table Widget | `packages/features/dashboard/components/TableWidget.tsx` | Widget for table display |
| Metric Card | `packages/features/dashboard/components/MetricCard.tsx` | Card for metric display |
| Feature Controls | `packages/features/dashboard/components/FeatureControls.tsx` | Controls for dashboard features |
| Data Mapping Modal | `packages/features/dashboard/components/DataMappingModal.tsx` | Modal for data mapping |
| Widget Config Modal | `packages/features/dashboard/components/WidgetConfigModal.tsx` | Modal for widget configuration |
| Share Dashboard Modal | `packages/features/dashboard/components/ShareDashboardModal.tsx` | Modal for dashboard sharing |
| Activity Feed | `packages/features/dashboard/components/collaboration/ActivityFeed.tsx` | Feed of user activities |
| Comment Thread | `packages/features/dashboard/components/collaboration/CommentThread.tsx` | Threaded comments |
| Chart Component | `packages/features/dashboard/components/visualization/ChartComponent.tsx` | Component for chart visualization |
| Data Grid | `packages/features/dashboard/components/visualization/DataGrid.tsx` | Grid for data display |
| Dashboard Context | `packages/features/dashboard/DashboardContext.tsx` | Context provider for dashboard |

### Admin Components
| Component | Path | Description |
|-----------|------|-------------|
| Admin Panel | `apps/frontend/src/components/AdminPanel/AdminPanel.tsx` | Main admin panel interface |
| API Monitor | `apps/frontend/src/components/AdminPanel/ApiMonitor.tsx` | Monitoring for API usage |
| Audit Logs | `apps/frontend/src/components/AdminPanel/AuditLogs.tsx` | Logs of system activities |
| Database Admin | `apps/frontend/src/components/AdminPanel/DatabaseAdmin.tsx` | Database administration interface |
| Feature Flags | `apps/frontend/src/components/AdminPanel/FeatureFlags.tsx` | Feature flag management |
| Role Manager | `apps/frontend/src/components/AdminPanel/RoleManager.tsx` | User role management |
| Script Runner | `apps/frontend/src/components/AdminPanel/ScriptRunner.tsx` | Interface for running scripts |
| Service Monitor | `apps/frontend/src/components/AdminPanel/ServiceMonitor.tsx` | Monitoring for services |
| Service Status | `apps/frontend/src/components/AdminPanel/ServiceStatus.tsx` | Status display for services |
| System Config | `apps/frontend/src/components/AdminPanel/SystemConfig.tsx` | System configuration interface |
| System Metrics | `apps/frontend/src/components/AdminPanel/SystemMetrics.tsx` | Metrics for system performance |
| User Management | `apps/frontend/src/components/AdminPanel/UserManagement.tsx` | User management interface |
| API Monitoring | `apps/frontend/src/components/admin/APIMonitoring.tsx` | Monitoring for API usage |
| MCP Monitor | `apps/frontend/src/components/admin/McpMonitor.tsx` | Monitoring for MCP |

### Prompt/AI Components
| Component | Path | Description |
|-----------|------|-------------|
| Prompt Workbench | `apps/frontend/src/components/PromptWorkbench/PromptWorkbench.tsx` | Workbench for prompt engineering |
| Prompt Editor | `apps/frontend/src/components/PromptWorkbench/PromptEditor.tsx` | Editor for prompts |
| Results Viewer | `apps/frontend/src/components/PromptWorkbench/ResultsViewer.tsx` | Viewer for prompt results |
| Test Case Manager | `apps/frontend/src/components/PromptWorkbench/TestCaseManager.tsx` | Manager for prompt test cases |
| Variable Manager | `apps/frontend/src/components/PromptWorkbench/VariableManager.tsx` | Manager for prompt variables |
| Version History | `apps/frontend/src/components/PromptWorkbench/VersionHistory.tsx` | History of prompt versions |
| Prompt Save Modal | `apps/frontend/src/components/PromptWorkbench/PromptSaveModal.tsx` | Modal for saving prompts |
| AI Code Assistant | `apps/frontend/src/components/ai/AICodeAssistant.tsx` | Assistant for code generation |
| AI Assistant | `apps/frontend/src/components/ai-assistant.tsx` | General AI assistant interface |
| LLM Config Manager | `apps/frontend/src/components/LLMConfigManager.tsx` | Manager for LLM configurations |
| LLM Selector | `apps/frontend/src/components/llm-selector.tsx` | Selector for LLM models |

### Utility Components
| Component | Path | Description |
|-----------|------|-------------|
| Loading | `apps/frontend/src/components/Loading.tsx` | Loading indicator |
| Error Fallback | `apps/frontend/src/components/ErrorFallback.tsx` | Fallback for error states |
| Markdown Renderer | `apps/frontend/src/components/MarkdownRenderer.tsx` | Renderer for markdown content |
| Status Monitor | `apps/frontend/src/components/StatusMonitor.tsx` | Monitor for system status |
| Settings Button | `apps/frontend/src/components/SettingsButton/SettingsButton.tsx` | Button for settings access |
| Theme Toggle | `apps/frontend/src/components/shared/ThemeToggle/ThemeToggle.tsx` | Toggle for theme switching |
| Video Chat | `apps/frontend/src/components/VideoChat/VideoChat.tsx` | Video chat interface |
| YouTube Transcriber | `apps/frontend/src/components/YouTubeTranscriber.tsx` | Tool for YouTube transcription |
| Connection Manager | `apps/frontend/src/components/ConnectionManager.tsx` | Manager for connections |
| Real-Time Connection | `apps/frontend/src/components/RealTimeConnection.tsx` | Handler for real-time connections |
| Session Provider | `apps/frontend/src/components/SessionProvider.tsx` | Provider for session state |
| Settings | `apps/frontend/src/components/Settings.tsx` | Settings interface |
| Visual Customization | `apps/frontend/src/components/VisualCustomization.tsx` | Interface for visual customization |
| Todo App | `apps/frontend/src/components/TodoApp.tsx` | Todo list application |
| Analytics | `apps/frontend/src/components/Analytics.tsx` | Analytics component |
| Performance Metrics | `apps/frontend/src/components/performance-metrics.tsx` | Display for performance metrics |
| System Metrics | `apps/frontend/src/components/system-metrics.tsx` | Display for system metrics |
| Global Search | `apps/frontend/src/components/search/GlobalSearch.tsx` | Global search interface |
| Command Palette | `apps/frontend/src/components/components/ui/command-palette.tsx` | Command palette interface |

### Knowledge/Memory Components
| Component | Path | Description |
|-----------|------|-------------|
| Knowledge Base Editor | `apps/frontend/src/components/knowledge/KnowledgeBaseEditor.tsx` | Editor for knowledge bases |
| Subgraph Module | `apps/frontend/src/components/knowledge/SubgraphModule.tsx` | Module for subgraph management |
| Memory Dashboard | `apps/frontend/src/components/memory/MemoryDashboard.tsx` | Dashboard for memory management |
| Memory Visualizer | `apps/frontend/src/components/memory/visualization/MemoryVisualizer.tsx` | Visualization of memory |
| Cluster Details | `apps/frontend/src/components/memory/visualization/ClusterDetails.tsx` | Details for memory clusters |
| Dynamic Knowledge Graph | `apps/frontend/src/components/dynamic-knowledge-graph.tsx` | Dynamic graph of knowledge |
| Knowledge Graph Viewer | `apps/frontend/src/components/wizard/KnowledgeGraphViewer.tsx` | Viewer for knowledge graphs |
| Graph Analysis | `apps/frontend/src/components/wizard/graph/GraphAnalysis.tsx` | Analysis of graph data |
| Graph Visualizer | `apps/frontend/src/components/wizard/graph/GraphVisualizer.tsx` | Visualization of graphs |
| Advanced Graph Algorithms | `apps/frontend/src/components/wizard/graph/AdvancedGraphAlgorithms.tsx` | Advanced algorithms for graphs |

### Onboarding Components
| Component | Path | Description |
|-----------|------|-------------|
| Feature Tour | `apps/frontend/src/components/onboarding/FeatureTour.tsx` | Tour of application features |
| User Onboarding | `apps/frontend/src/components/onboarding/UserOnboarding.tsx` | Onboarding process for new users |
| Wizard Interface | `apps/frontend/src/components/wizard/WizardInterface.tsx` | Wizard interface for guided flows |
| Wizard Provider | `apps/frontend/src/components/wizard/WizardProvider.tsx` | Provider for wizard state |
| Wizard Monitoring | `apps/frontend/src/components/wizard/WizardMonitoring.tsx` | Monitoring for wizard flows |
| Wizard WebSocket | `apps/frontend/src/components/wizard/WizardWebSocket.tsx` | WebSocket handler for wizards |
| Agent Config | `apps/frontend/src/components/wizard/AgentConfig.tsx` | Configuration wizard for agents |
| Advanced Agent Config | `apps/frontend/src/components/wizard/AdvancedAgentConfig.tsx` | Advanced configuration for agents |
| Graph Analytics | `apps/frontend/src/components/wizard/GraphAnalytics.tsx` | Analytics for graph data |
