import { GoogleGenAI, Type } from '@google/genai';

const getAi = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  return new GoogleGenAI({ apiKey });
};

export const scaffoldProjectWithAI = async (userIdea: string, existingAgents: any[]) => {
  const ai = getAi();
  const systemInstruction = `You are an AI orchestration engine. A user wants to build a project. Break their idea down into a short project name, a visually distinct hex color, and exactly 3 to 5 concrete tasks to get started. 
            
  Crucially, look at the available agent fleet: ${JSON.stringify(existingAgents)}. If a task clearly fits an agent's role (e.g. backend task for a backend engineer), assign the agent's ID to the 'assignee' field. If no agent fits, leave 'assignee' as null.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: `User's idea: ${userIdea}`,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Short project name (max 4 words)' },
          color: {
            type: Type.STRING,
            description:
              'A vibrant hex color starting with 0x, e.g., 0x3b82f6, 0x10b981, 0xef4444, 0x8b5cf6, 0xf59e0b',
          },
          tasks: {
            type: Type.ARRAY,
            description: 'List of 3 to 5 initial tasks',
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: 'Brief task title' },
                assignee: {
                  type: Type.STRING,
                  description: 'Agent ID if matched, or null',
                  nullable: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return JSON.parse(response.text || '{}');
};

export const generateAgentStatusReport = async (agent: any, proj: any) => {
  const ai = getAi();
  const prompt = `You are a cybernetic worker drone named "${agent.name}". Your class role is "${agent.role}". You are currently ${agent.currentTask ? `actively executing the process "${agent.currentTask}" for the project node "${proj?.name}"` : 'idle and awaiting new orders in the Nexus'}. Write a brief, 2-sentence, slightly humorous, in-character status report for the central orchestrator.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt,
  });

  return response.text;
};

export const breakDownTaskWithAI = async (taskTitle: string, projectName: string) => {
  const ai = getAi();
  const prompt = `Break down the task "${taskTitle}" for the project "${projectName}" into 2 or 3 smaller, actionable subtasks.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subtasks: {
            type: Type.ARRAY,
            description: '2 to 3 smaller actionable sub-tasks',
            items: { type: Type.STRING },
          },
        },
      },
    },
  });

  return JSON.parse(response.text || '{}');
};

export const analyzeProjectRiskWithAI = async (proj: any) => {
  const ai = getAi();
  const activeAgents = proj.tasks.map((t: any) => t.assignee).filter(Boolean);
  const prompt = `You are an expert AI Technical Project Manager. Analyze the project "${proj.name}".
  Current Progress: ${proj.progress}%
  Total Tasks: ${proj.tasks.length}
  Tasks Done: ${proj.tasks.filter((t: any) => t.status === 'done').length}
  Tasks To Do: ${proj.tasks.filter((t: any) => t.status === 'todo').length}
  Tasks In Progress: ${proj.tasks.filter((t: any) => t.status === 'in-progress').length}
  Agents assigned to this project: ${activeAgents.length}
  
  Write a 2-3 sentence strategic assessment pointing out any risks (e.g. bottlenecked tasks, no agents assigned, low progress) and 1 recommendation.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt,
  });

  return response.text;
};
