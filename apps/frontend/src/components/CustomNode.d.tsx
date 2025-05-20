import { NodeProps } from 'reactflow';
interface CustomNodeData {
    label: string;
    type: string;
    parameters?: Record<string, unknown>;
}
declare const CustomNode: import("react").MemoExoticComponent<({ data }: NodeProps<CustomNodeData>) => import("react").JSX.Element>;
export default CustomNode;
