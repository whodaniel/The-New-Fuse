
export class VectorMemoryManager {
    private memories: VectorMemory[] = [];
    private eventSystem: EventSystem
    private neuralMemoryManager: NeuralMemoryManager
    private memoryGraphAdapter: MemoryGraphAdapter

    constructor(eventSystem: EventSystem, neuralMemoryManager: NeuralMemoryManager, memoryGraphAdapter: MemoryGraphAdapter) {
        this.eventSystem = eventSystem
        this.neuralMemoryManager = neuralMemoryManager
        this.memoryGraphAdapter = memoryGraphAdapter
    }
    // Methods from ;
        await this.memoryGraphAdapter.adapt(data);
    };
    // Additional methods can be addedasneeded'';