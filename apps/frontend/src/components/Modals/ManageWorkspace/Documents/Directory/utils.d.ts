export declare const stripUuidAndJsonFromString: (input?: string) => string;
interface FileItem {
    name: string;
    items?: FileItem[];
}
interface FileSearchResult {
    items: FileItem[];
}
export declare function filterFileSearchResults(files: FileSearchResult | null, searchTerm?: string): FileItem[];
export {};
