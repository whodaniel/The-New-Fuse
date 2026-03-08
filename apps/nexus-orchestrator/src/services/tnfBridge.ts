/**
 * TNF Bridge
 * Synchronizes NexusOrchestrator with The-New-Fuse (TNF) ecosystem data.
 */

import { useStore } from '../store/useStore';

const API_BASE = '/api'; // Assumes proxy or same-origin deployment

export interface TNFAgent {
  id: string;
  name: string;
  role?: string;
  status: string;
  capabilities: string[];
}

export interface TNFTask {
  id: string;
  title: string;
  kind: string;
  status: string;
  owner?: string;
  source?: string;
  itinerary?: {
    lane: string;
    horizon: string;
  };
}

export const syncWithTNF = async () => {
  const store = useStore.getState();
  const token = localStorage.getItem('token');

  if (!token) {
    console.warn('NexusOrchestrator: No auth token found. Skipping sync.');
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  try {
    // 1. Fetch Agents
    const agentsRes = await fetch(`${API_BASE}/agents`, { headers });
    if (agentsRes.ok) {
      const agents: TNFAgent[] = await agentsRes.json();

      // Update store with TNF agents
      agents.forEach((agent) => {
        // Map TNF agent to Nexus agent format
        const nexusAgent = {
          name: agent.name,
          role: agent.role || (agent.capabilities && agent.capabilities[0]) || 'AI Agent',
          color: 0x3b82f6, // Default blue, can be randomized
          load: Math.floor(Math.random() * 50) + 10, // Mock load if not provided
        };

        // Only add if not already present (checking by name for now, or match ID)
        const existing = store.agents.find((a) => a.name === agent.name);
        if (!existing) {
          store.addAgent(nexusAgent);
        }
      });
    }

    // 2. Fetch Tasks (Unified Ledger)
    const tasksRes = await fetch(`${API_BASE}/unified-ledger/records?kind=task`, { headers });
    if (tasksRes.ok) {
      const tasks: TNFTask[] = await tasksRes.json();

      // Group tasks into projects or use a default "TNF Swarm" project
      const swarmProjectName = 'TNF Swarm';
      let swarmProject = store.projects.find((p) => p.name === swarmProjectName);

      if (!swarmProject) {
        store.addProject({
          name: swarmProjectName,
          color: 0x10b981,
          x: 0,
          z: 0,
          status: 'Active',
        });
        // refresh reference
        swarmProject = useStore.getState().projects.find((p) => p.name === swarmProjectName);
      }

      if (swarmProject) {
        tasks.forEach((task) => {
          const existingTask = swarmProject.tasks.find((t) => t.title === task.title);
          if (!existingTask) {
            store.addTask(swarmProject.id, {
              title: task.title,
              status: mapStatus(task.status),
              assignee: null,
            });
          }
        });
      }
    }
  } catch (error) {
    console.error('NexusOrchestrator Sync Error:', error);
  }
};

const mapStatus = (status: string): 'todo' | 'in-progress' | 'done' => {
  const s = status.toLowerCase();
  if (s === 'completed' || s === 'done') return 'done';
  if (s === 'active' || s === 'running' || s === 'in_progress') return 'in-progress';
  return 'todo';
};
