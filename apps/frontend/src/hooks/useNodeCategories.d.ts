import { NodeTemplate } from '../types/workflow';
export declare const useNodeCategories: () => {
    categories: {
        nodes: NodeTemplate[];
        id: string;
        name: string;
        description?: string;
    }[];
    searchNodes: (term: string) => void;
    getNodeTemplate: (nodeType: string) => NodeTemplate | undefined;
    getAllNodes: () => NodeTemplate[];
    searchTerm: string;
};
