import { BreadcrumbsConfig } from "@/types/navigation";

export const breadcrumbConfig: BreadcrumbsConfig = {
  "/dashboard": {
    label: "Dashboard",
    icon: "HomeIcon",
  },
  "/workspace": {
    label: "Workspace",
    icon: "WorkspaceIcon",
    children: {
      "/overview": { label: "Overview" },
      "/members": { label: "Members" },
      "/settings": { label: "Settings" },
    },
  },
  "/agents": {
    label: "Agents",
    icon: "AgentIcon",
    children: {
      "/list": { label: "All Agents" },
      "/marketplace": { label: "Marketplace" },
      "/:id": {
        label: (params) => `Agent ${params.id}`,
        dynamic: true,
      },
    },
  },
  "/analytics": {
    label: "Analytics",
    icon: "AnalyticsIcon",
    children: {
      "/dashboard": { label: "Dashboard" },
      "/reports": { label: "Reports" },
      "/visualization": { label: "Visualization" },
    },
  },
};
