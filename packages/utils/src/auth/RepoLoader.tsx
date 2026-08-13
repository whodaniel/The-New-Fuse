// Import Octokit only once
import { Octokit } from '@octokit/rest';
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

function isGitHubContentItem(item: unknown): item is GitHubContentItem {
    return !!(item &&
        typeof item === 'object' &&
        typeof (item as GitHubContentItem).path === 'string' &&
        typeof (item as GitHubContentItem).type === 'string' &&
        typeof (item as GitHubContentItem).name === 'string' &&
        typeof (item as GitHubContentItem).sha === 'string' &&
        typeof (item as GitHubContentItem).url === 'string');
}

function processGitHubContent(content: unknown[]): GitHubContentItem[] {
    return content.filter(isGitHubContentItem);
}

class GitHubRepoLoader {
    private owner: string;
    private repo: string;
    private branch: string;
    private recursive: boolean;
    private maxFiles: number;
    private fileExtensions: string[];
    private excludePaths: string[];
    private octokit: Octokit;

    constructor({
        owner,
        repo,
        branch = "main",
        accessToken,
        recursive = true,
        maxFiles = 100,
        fileExtensions = [],
        excludePaths = []
    }: LoaderConfig) {
        this.owner = owner;
        this.repo = repo;
        this.branch = branch;
        this.recursive = recursive;
        this.maxFiles = maxFiles;
        this.fileExtensions = fileExtensions;
        this.excludePaths = excludePaths;
        this.octokit = new Octokit({ auth: accessToken });
    }

    async load(): Promise<Document[]> {
        const files = await this.getFiles();
        const documents: Document[] = [];

        for (const file of files.slice(0, this.maxFiles)) {
            const content = await this.getFileContent(file.path);
            if (content) {
                documents.push({
                    pageContent: content,
                    metadata: {
                        source: file.html_url || file.url,
                        path: file.path,
                        size: file.size,
                    },
                });
            }
        }
        return documents;
    }

    async getFiles(): Promise<GitHubContentItem[]> {
        try {
            const response = await this.octokit.repos.getContent({
                owner: this.owner,
                repo: this.repo,
                path: "",
                ref: this.branch,
            });
            if (!Array.isArray(response.data)) {
                throw new Error("Repository content is not an array");
            }
            const files = processGitHubContent(response.data);
            if (this.recursive) {
                const directories = files.filter((item) => item.type === "dir");
                for (const dir of directories) {
                    const dirFiles = await this.getDirectoryContent(dir.path);
                    files.push(...dirFiles);
                }
            }
            return this.filterFiles(files);
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get files: ${error.message}`);
            }
            throw new Error('Failed to get files');
        }
    }

    filterFiles(files: GitHubContentItem[]): GitHubContentItem[] {
        return files.filter((file) => {
            if (this.excludePaths.some((excludePath) => file.path.includes(excludePath))) {
                return false;
            }
            if (this.fileExtensions.length === 0) {
                return true;
            }
            return this.fileExtensions.some((ext) => file.path.endsWith(ext));
        });
    }

    async getDirectoryContent(path: string): Promise<GitHubContentItem[]> {
        try {
            const response = await this.octokit.repos.getContent({
                owner: this.owner,
                repo: this.repo,
                path,
                ref: this.branch,
            });
            if (!Array.isArray(response.data)) {
                throw new Error("Directory content is not an array");
            }
            const files = processGitHubContent(response.data);
            const directories = files.filter((item) => item.type === "dir");
            for (const dir of directories) {
                const dirFiles = await this.getDirectoryContent(dir.path);
                files.push(...dirFiles);
            }
            return files;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get directory content for ${path}: ${error.message}`);
            }
            throw new Error(`Failed to get directory content for ${path}`);
        }
    }

    async getFileContent(path: string): Promise<string> {
        try {
            const response = await this.octokit.repos.getContent({
                owner: this.owner,
                repo: this.repo,
                path,
                ref: this.branch,
            });
            if (Array.isArray(response.data)) {
                throw new Error("File content is an array");
            }
            if (!('content' in response.data)) {
                throw new Error('No content found in response');
            }
            return Buffer.from(response.data.content, 'base64').toString('utf-8');
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get file content for ${path}: ${error.message}`);
            }
            throw new Error(`Failed to get file content for ${path}`);
        }
    }
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

export class RepoLoader {
    private octokit: Octokit;
    private config: RepoConfig;

    constructor(token: string, config: RepoConfig) {
        this.octokit = new Octokit({ auth: token });
        this.config = config;
    }

    private isValidFile(item: unknown): item is FileContent {
        if (!item || typeof item !== 'object') {
            return false;
        }
        const file = item as Record<string, unknown>;
        return typeof file.path === 'string' &&
            typeof file.sha === 'string' &&
            (file.type === 'file' || file.type === 'dir') &&
            (typeof file.content === 'string' || file.type === 'dir');
    }

    async getContents(path: string = ''): Promise<FileContent[]> {
        try {
            const response = await this.octokit.repos.getContent({
                owner: this.config.owner,
                repo: this.config.repo,
                path: path || this.config.path || '',
                ref: this.config.ref
            });

            const contents = Array.isArray(response.data) ? response.data : [response.data];
            // Cast to FileContent[] to satisfy TypeScript
            return contents.filter(this.isValidFile) as FileContent[];
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to load repo contents: ${error.message}`);
            }
            throw new Error('Failed to load repo contents');
        }
    }
}
