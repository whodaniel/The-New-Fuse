type NodeType = 'default' | 'input' | 'output' | 'process';
type NodeStatus = 'active' | 'inactive' | 'error' | 'success';
type NodeStyle = {
    borderColor?: string;
    backgroundColor?: string;
    [key: string]: any;
};
type Node = {
    id: string;
    label: string;
    type: NodeType;
    style: NodeStyle;
    data?: Record<string, any>;
};
type Edge = {
    source: string;
    target: string;
    label?: string;
    type?: string;
    style: {
        color: string;
        borderColor: string;
        borderWidth: number;
        borderStyle: string;
    };
};
export declare const adaptNodeStyle: (type: NodeType, status?: NodeStatus) => NodeStyle;
export declare const createNode: (id: string, label: string, type?: NodeType, data?: Record<string, any>) => Node;
export declare const createEdge: (source: string, target: string, label?: string, type?: string) => Edge;
export declare const updateNodeStyle: (node: Node, status: NodeStatus) => Node;
export declare const getNodeColor: (type: NodeType) => string;
export declare const getNodeBackground: (type: NodeType) => string;
export {};
