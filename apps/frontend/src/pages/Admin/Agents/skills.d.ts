import AgentWebSearchSelection from './WebSearchSelection';
import AgentSQLConnectorSelection from './SQLConnectorSelection';
import GenericSkillPanel from './GenericSkillPanel';
import DefaultSkillPanel from './DefaultSkillPanel';
import {
  Brain,
  File,
  Browser,
  ChartBar,
  FileMagnifyingGlass,
} from "@phosphor-icons/react";

export declare const defaultSkills: {
  "rag-memory": {
    title: string;
    description: string;
    component: typeof DefaultSkillPanel;
    icon: typeof Brain;
    image: string;
  };
  "view-summarize": {
    title: string;
    description: string;
    component: typeof DefaultSkillPanel;
    icon: typeof File;
    image: string;
  };
  "scrape-websites": {
    title: string;
    description: string;
    component: typeof DefaultSkillPanel;
    icon: typeof Browser;
    image: string;
  };
};

export declare const configurableSkills: {
  "save-file-to-browser": {
    title: string;
    description: string;
    component: typeof GenericSkillPanel;
    skill: string;
    icon: typeof FileMagnifyingGlass;
    image: string;
  };
  "create-chart": {
    title: string;
    description: string;
    component: typeof GenericSkillPanel;
    skill: string;
    icon: typeof ChartBar;
    image: string;
  };
  "web-browsing": {
    title: string;
    component: typeof AgentWebSearchSelection;
    skill: string;
  };
  "sql-agent": {
    title: string;
    component: typeof AgentSQLConnectorSelection;
    skill: string;
  };
};
