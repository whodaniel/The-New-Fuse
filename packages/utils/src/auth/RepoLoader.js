// Import Octokit only once
import { Octokit } from '@octokit/rest';
function isGitHubContentItem(item) {
    return !!(item &&
        typeof item === 'object' &&
        typeof item.path === 'string' &&
        typeof item.type === 'string' &&
        typeof item.name === 'string' &&
        typeof item.sha === 'string' &&
        typeof item.url === 'string');
}
function processGitHubContent(content) {
    return content.filter(isGitHubContentItem);
}
class GitHubRepoLoader {
    constructor({ owner, repo, branch = "main", accessToken, recursive = true, maxFiles = 100, fileExtensions = [], excludePaths = [] }) {
        this.owner = owner;
        this.repo = repo;
        this.branch = branch;
        this.recursive = recursive;
        this.maxFiles = maxFiles;
        this.fileExtensions = fileExtensions;
        this.excludePaths = excludePaths;
        this.octokit = new Octokit({ auth: accessToken });
    }
    async load() {
        const files = await this.getFiles();
        const documents = [];
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
    async getFiles() {
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
    filterFiles(files) {
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
    async getDirectoryContent(path) {
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
    async getFileContent(path) {
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
export class RepoLoader {
    constructor(token, config) {
        this.octokit = new Octokit({ auth: token });
        this.config = config;
    }
    isValidFile(item) {
        if (!item || typeof item !== 'object') {
            return false;
        }
        const file = item;
        return typeof file.path === 'string' &&
            typeof file.sha === 'string' &&
            (file.type === 'file' || file.type === 'dir') &&
            (typeof file.content === 'string' || file.type === 'dir');
    }
    async getContents(path = '') {
        try {
            const response = await this.octokit.repos.getContent({
                owner: this.config.owner,
                repo: this.config.repo,
                path: path || this.config.path || '',
                ref: this.config.ref
            });
            const contents = Array.isArray(response.data) ? response.data : [response.data];
            // Cast to FileContent[] to satisfy TypeScript
            return contents.filter(this.isValidFile);
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to load repo contents: ${error.message}`);
            }
            throw new Error('Failed to load repo contents');
        }
    }
}
//# sourceMappingURL=RepoLoader.js.map