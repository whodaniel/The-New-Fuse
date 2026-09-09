export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  listId: string;
  listTitle?: string;
  updated: string;
}

export interface GoogleTaskList {
  id: string;
  title: string;
  updated: string;
}

export interface SparkTaskIngestion {
  id: string;
  sourceType: 'docs_export' | 'spark_prompt' | 'gem_conversation';
  title: string;
  rawContent: string;
  parsedObjectives: string[];
  actionItems: {
    id: string;
    description: string;
    targetAgentRole?: string;
    status: 'pending' | 'dispatched' | 'completed';
  }[];
  createdAt: string;
}

export interface AIStudioPromptTemplate {
  id: string;
  name: string;
  description: string;
  model: string;
  systemInstruction: string;
  userPrompt: string;
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
  tags: string[];
}
