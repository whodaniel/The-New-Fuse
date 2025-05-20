flowchart TB
    subgraph Auth
        Login[/auth/login]
        Register[/auth/register]
        ForgotPassword[/auth/forgot-password]
    end

    subgraph MainDashboard
        Dashboard[/dashboard/main]
        Analytics[/dashboard/analytics]
        AgentOverview[/dashboard/agents]
    end

    subgraph Features
        subgraph Agents
            AgentList[/agents/list]
            AgentDetail[/agents/detail]
            AgentConfig[/agents/config]
        end

        subgraph Chat
            ChatDashboard[/chat/dashboard]
            ChatRoom[/chat/room]
            RooCoderChat[/chat/roocoder]
        end

        subgraph Workflow
            WorkflowList[/workflow/list]
            WorkflowEditor[/workflow/editor]
            WorkflowCanvas[/workflow/canvas]
        end

        subgraph Analytics
            AnalyticsDashboard[/analytics/dashboard]
            Visualization[/analytics/visualization]
            Reports[/analytics/reports]
        end
    end

    subgraph Settings
        UserSettings[/settings/user]
        WorkspaceSettings[/settings/workspace]
        TeamSettings[/settings/team]
    end

    Login --> Dashboard
    Register --> Dashboard
    Dashboard --> Features
    Dashboard --> Settings