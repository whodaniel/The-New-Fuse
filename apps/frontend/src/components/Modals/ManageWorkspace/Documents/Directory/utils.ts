import strDistance from "js-levenshtein";
const LEVENSHTEIN_MIN = 2;
const uuidPattern = /-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/;
const jsonPattern = /\.json$/;
export const stripUuidAndJsonFromString = (input: string = ""): string => {
    return input?.replace(uuidPattern, "")?.replace(jsonPattern, "")?.replace("-", " ") ?? "";
};

interface FileItem {
    name: string;
    items?: FileItem[];
}

interface FileSearchResult {
    items: FileItem[];
}

export function filterFileSearchResults(files: FileSearchResult | null, searchTerm: string = ""): FileItem[] {
    if (!searchTerm) return files?.items || [];
    
    const normalizedSearchTerm = searchTerm.toLowerCase().trim();
    const searchResult: FileItem[] = [];
    for (const folder of files?.items || []) {
        const folderNameNormalized = folder.name.toLowerCase();
        if (folderNameNormalized.includes(normalizedSearchTerm)) {
            searchResult.push(folder);
            continue;
        }
        const fileSearchResults = [];
        for (const file of folder === null || folder === void 0 ? void 0 : folder.items) {
            const fileNameNormalized = stripUuidAndJsonFromString(file.name).toLowerCase();
            if (fileNameNormalized.includes(normalizedSearchTerm)) {
                fileSearchResults.push(file);
            }
            else if (fileSearchResults.length === 0 &&
                strDistance(fileNameNormalized, normalizedSearchTerm) <= LEVENSHTEIN_MIN) {
                fileSearchResults.push(file);
            }
        }
        if (fileSearchResults.length > 0) {
            searchResult.push(Object.assign(Object.assign({}, folder), { items: fileSearchResults }));
        }
    }

    return searchResult;
}
//# sourceMappingURL=utils.js.map