import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  assignee: string | null;
}

export interface Project {
  id: string;
  name: string;
  color: number;
  x: number;
  z: number;
  progress: number;
  status: string;
  tasks: Task[];
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  color: number;
  currentProject: string | null;
  currentTask: string | null;
  load: number;
}

export interface Log {
  id: string;
  message: string;
  type: 'info' | 'system' | 'success' | 'alert';
  timestamp: string;
}

interface AppState {
  projects: Project[];
  agents: Agent[];
  logs: Log[];
  selectedEntity: { id: string; type: 'project' | 'agent' } | null;
  isMindMapOpen: boolean;
  activeModal: 'project' | 'agent' | 'task' | 'ai-scaffold' | null;
  modalData: any;
  cameraTarget: { x: number; y: number; z: number } | null;

  // Actions
  addProject: (project: Omit<Project, 'id' | 'tasks' | 'progress'>) => void;
  addAgent: (agent: Omit<Agent, 'id' | 'currentProject' | 'currentTask'>) => void;
  addTask: (projectId: string, task: Omit<Task, 'id'>) => void;
  updateTaskStatus: (projectId: string, taskId: string, status: TaskStatus) => void;
  assignTask: (projectId: string, taskId: string, agentId: string | null) => void;
  addLog: (message: string, type?: Log['type']) => void;
  setSelectedEntity: (entity: { id: string; type: 'project' | 'agent' } | null) => void;
  setMindMapOpen: (isOpen: boolean) => void;
  setActiveModal: (modal: AppState['activeModal'], data?: any) => void;
  setCameraTarget: (target: { x: number; y: number; z: number } | null) => void;

  // AI specific actions
  scaffoldProject: (projectData: any) => void;
  breakDownTask: (projectId: string, taskId: string, subtasks: string[]) => void;
}

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj_marketing',
    name: 'Marketing Site 2.0',
    status: 'Active',
    color: 0x3b82f6,
    x: -15,
    z: -10,
    progress: 65,
    tasks: [
      { id: 't1', title: 'Design System', status: 'done', assignee: null },
      { id: 't2', title: 'Hero Animation', status: 'in-progress', assignee: 'agent_alpha' },
      { id: 't3', title: 'SEO Optimization', status: 'todo', assignee: null },
    ],
  },
  {
    id: 'proj_ecommerce',
    name: 'E-Comm Engine',
    status: 'Critical',
    color: 0xef4444,
    x: 15,
    z: -5,
    progress: 30,
    tasks: [
      { id: 't4', title: 'Stripe Integration', status: 'in-progress', assignee: 'agent_beta' },
    ],
  },
];

const INITIAL_AGENTS: Agent[] = [
  {
    id: 'agent_alpha',
    name: 'UI Bot (Alpha)',
    role: 'Frontend Designer',
    color: 0x60a5fa,
    currentProject: 'proj_marketing',
    currentTask: 'Hero Animation',
    load: 75,
  },
  {
    id: 'agent_beta',
    name: 'Logic Bot (Beta)',
    role: 'Backend Engineer',
    color: 0xf87171,
    currentProject: 'proj_ecommerce',
    currentTask: 'Stripe Integration',
    load: 92,
  },
  {
    id: 'agent_gamma',
    name: 'Ops Bot (Gamma)',
    role: 'DevOps & CI/CD',
    color: 0x34d399,
    currentProject: null,
    currentTask: null,
    load: 10,
  },
];

export const useStore = create<AppState>((set, get) => ({
  projects: INITIAL_PROJECTS,
  agents: INITIAL_AGENTS,
  logs: [
    {
      id: uuidv4(),
      message: 'Simulation initialized. Core loops active...',
      type: 'system',
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
    },
  ],
  selectedEntity: null,
  isMindMapOpen: false,
  activeModal: null,
  modalData: null,
  cameraTarget: null,

  addProject: (project) =>
    set((state) => {
      const newProject: Project = {
        ...project,
        id: `proj_${uuidv4()}`,
        tasks: [],
        progress: 0,
      };
      return { projects: [...state.projects, newProject] };
    }),

  addAgent: (agent) =>
    set((state) => {
      const newAgent: Agent = {
        ...agent,
        id: `agent_${uuidv4()}`,
        currentProject: null,
        currentTask: null,
      };
      return { agents: [...state.agents, newAgent] };
    }),

  addTask: (projectId, task) =>
    set((state) => {
      const newTask: Task = { ...task, id: `t_${uuidv4()}` };
      const projects = state.projects.map((p) => {
        if (p.id === projectId) {
          return { ...p, tasks: [...p.tasks, newTask] };
        }
        return p;
      });

      let agents = state.agents;
      if (task.assignee) {
        agents = agents.map((a) => {
          if (a.id === task.assignee) {
            return { ...a, currentProject: projectId, currentTask: task.title };
          }
          return a;
        });
      }

      return { projects, agents };
    }),

  updateTaskStatus: (projectId, taskId, status) =>
    set((state) => {
      let agents = state.agents;
      const projects = state.projects.map((p) => {
        if (p.id === projectId) {
          const tasks = p.tasks.map((t) => {
            if (t.id === taskId) {
              if (status === 'done' && t.assignee) {
                agents = agents.map((a) => (a.id === t.assignee ? { ...a, currentTask: null } : a));
              }
              return { ...t, status };
            }
            return t;
          });
          const done = tasks.filter((t) => t.status === 'done').length;
          const progress = Math.round((done / tasks.length) * 100) || 0;
          return { ...p, tasks, progress };
        }
        return p;
      });
      return { projects, agents };
    }),

  assignTask: (projectId, taskId, agentId) =>
    set((state) => {
      let taskTitle = '';
      const projects = state.projects.map((p) => {
        if (p.id === projectId) {
          const tasks = p.tasks.map((t) => {
            if (t.id === taskId) {
              taskTitle = t.title;
              return {
                ...t,
                assignee: agentId,
                status: (agentId ? 'in-progress' : 'todo') as TaskStatus,
              };
            }
            return t;
          });
          return { ...p, tasks };
        }
        return p;
      });

      const agents = state.agents.map((a) => {
        if (a.id === agentId) {
          return { ...a, currentProject: projectId, currentTask: taskTitle };
        }
        if (a.currentProject === projectId && a.currentTask === taskTitle && a.id !== agentId) {
          return { ...a, currentProject: null, currentTask: null };
        }
        return a;
      });

      return { projects, agents };
    }),

  addLog: (message, type = 'info') =>
    set((state) => ({
      logs: [
        ...state.logs,
        {
          id: uuidv4(),
          message,
          type,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        },
      ],
    })),

  setSelectedEntity: (entity) => set({ selectedEntity: entity }),
  setMindMapOpen: (isOpen) => set({ isMindMapOpen: isOpen }),
  setActiveModal: (modal, data = null) => set({ activeModal: modal, modalData: data }),
  setCameraTarget: (target) => set({ cameraTarget: target }),

  scaffoldProject: (projectData) =>
    set((state) => {
      const projId = `proj_${uuidv4()}`;
      const newProj: Project = {
        id: projId,
        name: projectData.name,
        color: parseInt(projectData.color, 16) || 0x8b5cf6,
        progress: 0,
        status: 'Active',
        x: projectData.x,
        z: projectData.z,
        tasks: projectData.tasks.map((t: any) => ({
          id: `t_${uuidv4()}`,
          title: t.title,
          status: (t.assignee ? 'in-progress' : 'todo') as TaskStatus,
          assignee: t.assignee || null,
        })),
      };

      let agents = state.agents;
      newProj.tasks.forEach((t) => {
        if (t.assignee) {
          agents = agents.map((a) => {
            if (a.id === t.assignee) {
              return {
                ...a,
                currentProject: projId,
                currentTask: t.title,
                load: Math.floor(Math.random() * 40) + 50,
              };
            }
            return a;
          });
        }
      });

      return { projects: [...state.projects, newProj], agents };
    }),

  breakDownTask: (projectId, taskId, subtasks) =>
    set((state) => {
      const projects = state.projects.map((p) => {
        if (p.id === projectId) {
          const newTasks = subtasks.map((title) => ({
            id: `t_${uuidv4()}`,
            title,
            status: 'todo' as TaskStatus,
            assignee: null,
          }));
          return { ...p, tasks: [...p.tasks, ...newTasks] };
        }
        return p;
      });
      return { projects };
    }),
}));
