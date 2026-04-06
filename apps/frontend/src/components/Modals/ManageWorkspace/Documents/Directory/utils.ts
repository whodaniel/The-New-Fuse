import strDistance from 'js-levenshtein';

const LEVENSHTEIN_MIN = 2;
const uuidPattern = /-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/;
const jsonPattern = /\.json$/;

export const stripUuidAndJsonFromString = (input: string = ''): string => {
  return input?.replace(uuidPattern, '')?.replace(jsonPattern, '')?.replace('-', ' ') ?? '';
};

export interface FileItem {
  id?: string;
  name: string;
  items?: FileItem[];
}

export interface FileSearchResult {
  items: FileItem[];
}

export function filterFileSearchResults(
  files: FileSearchResult | null,
  searchTerm: string = ''
): FileItem[] {
  if (!searchTerm) return files?.items || [];

  const normalizedSearchTerm = searchTerm.toLowerCase().trim();
  const searchResult: FileItem[] = [];

  for (const folder of files?.items || []) {
    const folderNameNormalized = folder.name.toLowerCase();

    if (folderNameNormalized.includes(normalizedSearchTerm)) {
      searchResult.push(folder);
      continue;
    }

    const fileSearchResults: FileItem[] = [];
    const childItems = folder.items || [];

    for (const file of childItems) {
      const fileNameNormalized = stripUuidAndJsonFromString(file.name).toLowerCase();

      if (fileNameNormalized.includes(normalizedSearchTerm)) {
        fileSearchResults.push(file);
      } else if (
        fileSearchResults.length === 0 &&
        strDistance(fileNameNormalized, normalizedSearchTerm) <= LEVENSHTEIN_MIN
      ) {
        fileSearchResults.push(file);
      }
    }

    if (fileSearchResults.length > 0) {
      searchResult.push({
        ...folder,
        items: fileSearchResults,
      });
    }
  }

  return searchResult;
}
