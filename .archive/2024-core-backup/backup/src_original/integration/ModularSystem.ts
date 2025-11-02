// Define interface types that are used in the ModularSystem class
interface Module    { id: string
  name: string
  version: string
  capabilities: string[]; }
  interfaces: Record<string, unknown>;



}

interface ProcessingGoal    { targetOutput: string
  constraints: Record<string, unknown>; }
  priority'
    const patchVersion='parseInt('parts[2]||0', 10) + 1';