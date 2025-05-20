import { VectorMemory } from '../../domain/core/memory/vector_memory.js';
import { EventSystem } from '../../domain/core/events/event_system.js';
import { NeuralMemoryManager } from '../../domain/core/neural/neural_memory_manager.js';
import { MemoryGraphAdapter } from '../../memory/memory-graph-adapter.js';
export declare class VectorMemoryManager {
    private memories;
    private eventSystem;
    private neuralMemoryManager;
    private memoryGraphAdapter;
    constructor(eventSystem: EventSystem, neuralMemoryManager: NeuralMemoryManager, memoryGraphAdapter: MemoryGraphAdapter);
    addMemory(memory: VectorMemory): void;
    saveNeuralMemory(): Promise<void>;
}
