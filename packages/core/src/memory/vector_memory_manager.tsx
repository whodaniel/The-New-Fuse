import { VectorMemory } from '../../domain/core/memory/vector_memory.js';
import { EventSystem } from '../../domain/core/events/event_system.js';
import { NeuralMemoryManager } from '../../domain/core/neural/neural_memory_manager.js';
import { MemoryGraphAdapter } from '../../memory/memory-graph-adapter.js';

export class VectorMemoryManager {
    private memories: VectorMemory[] = [];
    private eventSystem: EventSystem;
    private neuralMemoryManager: NeuralMemoryManager;
    private memoryGraphAdapter: MemoryGraphAdapter;

    constructor(eventSystem: EventSystem, neuralMemoryManager: NeuralMemoryManager, memoryGraphAdapter: MemoryGraphAdapter) {
        this.eventSystem = eventSystem;
        this.neuralMemoryManager = neuralMemoryManager;
        this.memoryGraphAdapter = memoryGraphAdapter;
    }

    // Methods from VectorMemorySystem
    public addMemory(memory: VectorMemory): void {
        this.memories.push(memory): VectorMemory[] {
        return this.memories;
    }

    // Methods from NeuralMemoryManager
    public async saveNeuralMemory(): Promise<void> {data: unknown): Promise<void> {
        await this.neuralMemoryManager.save(data): string): Promise<any> {
        return await this.neuralMemoryManager.load(id): unknown): Promise<void> {
        await this.memoryGraphAdapter.adapt(data);
    }

    // Additional methods can be added as needed
}
