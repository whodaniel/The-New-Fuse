interface GitHubContentItem {
    path: string;
    type: string;
    name: string;
    sha: string;
    url: string;
    html_url?: string;
    size?: number;
}
interface LoaderConfig {
    owner: string;
    repo: string;
    branch?: string;
    accessToken: string;
    recursive?: boolean;
    maxFiles?: number;
    fileExtensions?: string[];
    excludePaths?: string[];
}
interface Document {
    pageContent: string;
    metadata: {
        source: string;
        path: string;
        size?: number;
    };
}
declare class GitHubRepoLoader {
    private owner;
    private repo;
    private branch;
    private recursive;
    private maxFiles;
    private fileExtensions;
    private excludePaths;
    private octokit;
    constructor({ owner, repo, branch, accessToken, recursive, maxFiles, fileExtensions, excludePaths }: LoaderConfig);
    load(): Promise<Document[]>;
    getFiles(): Promise<GitHubContentItem[]>;
    filterFiles(files: GitHubContentItem[]): GitHubContentItem[];
    getDirectoryContent(path: string): Promise<GitHubContentItem[]>;
    getFileContent(path: string): Promise<string>;
}
export default GitHubRepoLoader;
interface RepoConfig {
    owner: string;
    repo: string;
    path?: string;
    ref?: string;
}
interface FileContent {
    path: string;
    content: string;
    type: 'file' | 'dir';
    sha: string;
}
export declare class RepoLoader {
    private octokit;
    private config;
    constructor(token: string, config: RepoConfig);
    private isValidFile;
    getContents(path?: string): Promise<FileContent[]>;
}
//# sourceMappingURL=RepoLoader.d.ts.map