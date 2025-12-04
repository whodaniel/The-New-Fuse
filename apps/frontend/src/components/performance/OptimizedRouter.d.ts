import React from 'react';
declare const CorePages: {
    auth: {
        ForgotPassword: React.LazyExoticComponent<React.ComponentType<any>>;
        ResetPassword: React.LazyExoticComponent<React.ComponentType<any>>;
        SSOPage: React.LazyExoticComponent<React.ComponentType<any>>;
        GoogleCallback: React.LazyExoticComponent<React.ComponentType<any>>;
        OAuthCallback: React.LazyExoticComponent<React.ComponentType<any>>;
    };
    dashboard: {
        Analytics: React.LazyExoticComponent<React.ComponentType<any>>;
        AgentDashboard: React.LazyExoticComponent<React.ComponentType<any>>;
        CreateAgent: React.LazyExoticComponent<React.ComponentType<any>>;
        DashboardSettings: React.LazyExoticComponent<React.ComponentType<any>>;
    };
    agents: {
        AgentsPage: React.LazyExoticComponent<React.ComponentType<any>>;
        AgentDetail: React.LazyExoticComponent<React.ComponentType<any>>;
        UnifiedAgentCreator: React.LazyExoticComponent<React.ComponentType<any>>;
        NFTMarketplacePage: React.LazyExoticComponent<React.ComponentType<any>>;
        RevenueDashboardPage: React.LazyExoticComponent<React.ComponentType<any>>;
    };
    workflows: {
        Workflows: React.LazyExoticComponent<React.ComponentType<any>>;
        WorkflowBuilder: React.LazyExoticComponent<React.ComponentType<any>>;
        WorkflowDetail: React.LazyExoticComponent<React.ComponentType<any>>;
        WorkflowExecution: React.LazyExoticComponent<React.ComponentType<any>>;
        WorkflowTemplates: React.LazyExoticComponent<React.ComponentType<any>>;
    };
    admin: {
        AdminPanel: React.LazyExoticComponent<React.ComponentType<any>>;
        UserManagement: React.LazyExoticComponent<React.ComponentType<any>>;
        SystemHealth: React.LazyExoticComponent<React.ComponentType<any>>;
        FeatureFlags: React.LazyExoticComponent<React.ComponentType<any>>;
        PortManagement: React.LazyExoticComponent<React.ComponentType<any>>;
        Onboarding: React.LazyExoticComponent<React.ComponentType<any>>;
        Dashboard: React.LazyExoticComponent<React.ComponentType<any>>;
        ExperimentalFeatures: React.LazyExoticComponent<React.ComponentType<any>>;
        Settings: React.LazyExoticComponent<React.ComponentType<any>>;
        WorkspaceManagement: React.LazyExoticComponent<React.ComponentType<any>>;
    };
    settings: {
        Settings: React.LazyExoticComponent<React.ComponentType<any>>;
        GeneralSettings: React.LazyExoticComponent<React.ComponentType<any>>;
        Appearance: React.LazyExoticComponent<React.ComponentType<any>>;
        Notifications: React.LazyExoticComponent<React.ComponentType<any>>;
        Security: React.LazyExoticComponent<React.ComponentType<any>>;
        API: React.LazyExoticComponent<React.ComponentType<any>>;
        EmbeddingPreference: React.LazyExoticComponent<React.ComponentType<any>>;
    };
    chat: {
        ChatPage: React.LazyExoticComponent<React.ComponentType<any>>;
        WorkspaceChat: React.LazyExoticComponent<React.ComponentType<any>>;
    };
    workspace: {
        Overview: React.LazyExoticComponent<React.ComponentType<any>>;
        Analytics: React.LazyExoticComponent<React.ComponentType<any>>;
        Members: React.LazyExoticComponent<React.ComponentType<any>>;
        Settings: React.LazyExoticComponent<React.ComponentType<any>>;
        Layout: React.LazyExoticComponent<React.ComponentType<any>>;
    };
    tasks: {
        TasksPage: React.LazyExoticComponent<React.ComponentType<any>>;
        TaskDetail: React.LazyExoticComponent<React.ComponentType<any>>;
        TaskEdit: React.LazyExoticComponent<React.ComponentType<any>>;
        NewTask: React.LazyExoticComponent<React.ComponentType<any>>;
    };
    suggestions: {
        Suggestions: React.LazyExoticComponent<React.ComponentType<any>>;
        NewSuggestion: React.LazyExoticComponent<React.ComponentType<any>>;
        SuggestionDetail: React.LazyExoticComponent<React.ComponentType<any>>;
    };
    landing: {
        Landing: React.LazyExoticComponent<React.ComponentType<any>>;
        OnboardingFlow: React.LazyExoticComponent<React.ComponentType<any>>;
        Preview: React.LazyExoticComponent<React.ComponentType<any>>;
    };
    ui: {
        ComponentsShowcase: React.LazyExoticComponent<React.ComponentType<any>>;
        ComponentsNav: React.LazyExoticComponent<React.ComponentType<any>>;
        FrontendShowcase: React.LazyExoticComponent<React.ComponentType<any>>;
        LayoutExamples: React.LazyExoticComponent<React.ComponentType<any>>;
        TimelineDemo: React.LazyExoticComponent<React.ComponentType<any>>;
    };
    specialized: {
        AIAgentPortal: React.LazyExoticComponent<React.ComponentType<any>>;
        SophisticatedTNFHub: React.LazyExoticComponent<React.ComponentType<any>>;
        MultiAgentChat: React.LazyExoticComponent<React.ComponentType<any>>;
        CommunityHub: React.LazyExoticComponent<React.ComponentType<any>>;
        WorkflowTemplates: React.LazyExoticComponent<React.ComponentType<any>>;
    };
    system: {
        Debug: React.LazyExoticComponent<React.ComponentType<any>>;
        DebugRouting: React.LazyExoticComponent<React.ComponentType<any>>;
        BuildInfo: React.LazyExoticComponent<React.ComponentType<any>>;
        Test: React.LazyExoticComponent<React.ComponentType<any>>;
        SimpleTest: React.LazyExoticComponent<React.ComponentType<any>>;
        AllPages: React.LazyExoticComponent<React.ComponentType<any>>;
        NotFound: React.LazyExoticComponent<React.ComponentType<any>>;
        Unauthorized: React.LazyExoticComponent<React.ComponentType<any>>;
    };
    legal: {
        PrivacyPolicy: React.LazyExoticComponent<React.ComponentType<any>>;
        TermsOfService: React.LazyExoticComponent<React.ComponentType<any>>;
    };
};
declare const RouteGroups: {
    core: {
        path: string;
        name: string;
        component: React.LazyExoticComponent<React.ComponentType<any>>;
    }[];
    auth: {
        path: string;
        component: any;
    }[];
    user: {
        path: string;
        component: React.LazyExoticComponent<React.ComponentType<any>>;
    }[];
    admin: {
        path: string;
        component: React.LazyExoticComponent<React.ComponentType<any>>;
    }[];
    features: {
        path: string;
        component: React.LazyExoticComponent<React.ComponentType<any>>;
    }[];
    workspace: {
        path: string;
        component: React.LazyExoticComponent<React.ComponentType<any>>;
    }[];
    settings: {
        path: string;
        component: React.LazyExoticComponent<React.ComponentType<any>>;
    }[];
    specialized: {
        path: string;
        component: React.LazyExoticComponent<React.ComponentType<any>>;
    }[];
    ui: {
        path: string;
        component: React.LazyExoticComponent<React.ComponentType<any>>;
    }[];
    system: {
        path: string;
        component: React.LazyExoticComponent<React.ComponentType<any>>;
    }[];
    landing: {
        path: string;
        component: React.LazyExoticComponent<React.ComponentType<any>>;
    }[];
};
declare const OptimizedRouter: React.FC;
export default OptimizedRouter;
export { CorePages, RouteGroups };
