export {}
exports.useFlowMemory = void 0;
import react_1 from 'react';
import useFlowRouter_1 from './useFlowRouter.js';
const useFlowMemory = (memoryManager): any => {
    const { currentNode, navigateToNode } = (0, useFlowRouter_1.useFlowRouter)();
    const saveNodeMemory = (0, react_1.useCallback)(async (node) => {
        await memoryManager.saveNeuralMemory({
            nodeId: node.id,
            type: node.type,
            data: node.data,
            position: node.position,
            timestamp: new Date().toISOString()
        });
    }, [memoryManager]);
    const loadNodeMemory = (0, react_1.useCallback)(async (nodeId) => {
        const memory = await memoryManager.loadNeuralMemory(nodeId);
        return memory;
    }, [memoryManager]);
    const updateFlowMemoryGraph = (0, react_1.useCallback)(async (nodes, edges) => {
        await memoryManager.adaptMemoryGraph({
            nodes,
            edges,
            currentNode: currentNode === null || currentNode === void 0 ? void 0 : currentNode.id
        });
    }, [memoryManager, currentNode]);
    return {
        saveNodeMemory,
        loadNodeMemory,
        updateFlowMemoryGraph
    };
};
exports.useFlowMemory = useFlowMemory;
export {};
//# sourceMappingURL=useFlowMemory.js.map