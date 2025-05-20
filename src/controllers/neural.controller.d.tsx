import {
  MemoryContent,
  MemoryQuery,
  PromptTemplate,
} from "@the-new-fuse/types";
export declare class NeuralController {
  private readonly agentService;
  private readonly memorySystem;
  private readonly promptService;
  constructor(
    agentService: AgentLLMService,
    memorySystem: MemorySystem,
    promptService: PromptService,
  );
  searchMemories(query: MemoryQuery): Promise<any>;
  addMemory(content: MemoryContent): Promise<any>;
  addMemoryBatch(body: { memories: MemoryContent[] }): Promise<any>;
  renderPrompt(body: {
    template: PromptTemplate;
    variables: Record<string, any>;
  }): Promise<any>;
  generate(body: {
    prompt: string;
    options?: Record<string, any>;
  }): Promise<any>;
}
