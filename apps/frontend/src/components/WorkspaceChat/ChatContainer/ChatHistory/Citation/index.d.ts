interface Source {
    title: string;
    text?: string;
    chunkSource?: string;
    score?: number | null;
}
interface CitationsProps {
    sources?: Source[];
}
export default function Citations({ sources }: CitationsProps): JSX.Element | null;
export {};
