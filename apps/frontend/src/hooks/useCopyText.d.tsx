export default function useCopyText(delay?: number): {
    copyText: (content: any) => Promise<void>;
    copied: boolean;
};
