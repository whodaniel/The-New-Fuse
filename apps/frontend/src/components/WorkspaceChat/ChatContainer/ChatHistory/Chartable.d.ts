import { WorkspaceData } from '@/types/workspace';
interface ChartableProps {
    workspace: WorkspaceData | null;
    props: {
        content: string;
        uuid?: string;
        type?: string;
    };
}
export default function Chartable({ workspace, props }: ChartableProps): import("react/jsx-runtime").JSX.Element;
export {};
