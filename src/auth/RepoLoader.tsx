import { Octokit } from '@octokit/rest';

export interface GitHubContentItem {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url?: string;
  git_url?: string;
  download_url?: string;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
}

export interface Document {
  pageContent: string;
  metadata: {
    source: string;
    path: string;
    size: number;
  };
}

export interface RepoLoaderConfig {
  owner: string;
  repo: string;
  branch?: string;
  accessToken?: string;
  recursive?: boolean;
  maxFiles?: number;
  fileExtensions?: string[];
  excludePaths?: string[];
}

const isGitHubContentItem = (item: any): item is GitHubContentItem => {
  return !!(item &&
    typeof item === 'object' &&
    typeof (item as GitHubContentItem).path === 'string' &&
    typeof (item as GitHubContentItem).type === 'string' &&
    typeof (item as GitHubContentItem).name === 'string' &&
    typeof (item as GitHubContentItem).sha === 'string' &&
    typeof (item as GitHubContentItem).url === 'string');
};

export class GitHubRepoLoader {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private branch: string;
  private recursive: boolean;
  private maxFiles: number;
  private fileExtensions: string[];
  private excludePaths: string[];

  constructor({
    owner,
    repo,
    branch = 'main',
    accessToken,
    recursive = true,
    maxFiles = 100,
    fileExtensions = [],
    excludePaths = []
  }: RepoLoaderConfig) {
    this.octokit = new Octokit({
      auth: accessToken,
    });

    this.owner = owner;
    this.repo = repo;
    this.branch = branch;
    this.recursive = recursive;
    this.maxFiles = maxFiles;
    this.fileExtensions = fileExtensions;
    this.excludePaths = excludePaths;
  }

  async load(): Promise<Document[]> {
    const files = await this.getFiles();
    const documents: Document[] = [];

    for (const file of files.slice(0, this.maxFiles)) {
      if (file.type === 'file' && file.download_url) {
        try {
          const response = await fetch(file.download_url);
          const content = await response.text();

          documents.push({
            pageContent: content,
            metadata: {
              source: file.html_url || file.url,
              path: file.path,
              size: file.size,
            },
          });
        } catch (error) {
          console.warn(`Failed to load file ${file.path}:`, error);
        }
      }
    }

    return documents;
  }

  async getFiles(): Promise<GitHubContentItem[]> {
    try {
      const response = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: '',
        ref: this.branch,
      });

      if (!Array.isArray(response.data)) {
        throw new Error('Repository content is not an array');
      }

      const files = this.processGitHubContent(response.data);

      if (this.recursive) {
        const directories = files.filter((item) => item.type === 'dir');
        for (const dir of directories) {
          const subFiles = await this.getDirectoryFiles(dir.path);
          files.push(...subFiles);
        }
      }

      return this.filterFiles(files);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch repository files: ${error.message}`);
      }
      throw new Error('Failed to fetch repository files');
    }
  }

  private async getDirectoryFiles(path: string): Promise<GitHubContentItem[]> {
    try {
      const response = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: path,
        ref: this.branch,
      });

      if (!Array.isArray(response.data)) {
        return [];
      }

      const files = this.processGitHubContent(response.data);
      const result: GitHubContentItem[] = [];

      for (const file of files) {
        if (file.type === 'file') {
          result.push(file);
        } else if (file.type === 'dir' && this.recursive) {
          const subFiles = await this.getDirectoryFiles(file.path);
          result.push(...subFiles);
        }
      }

      return result;
    } catch (error) {
      console.warn(`Failed to load directory ${path}:`, error);
      return [];
    }
  }

  private processGitHubContent(content: any[]): GitHubContentItem[] {
    return content
      .filter(isGitHubContentItem)
      .map((item) => ({
        name: item.name,
        path: item.path,
        sha: item.sha,
        size: item.size,
        url: item.url,
        html_url: item.html_url,
        git_url: item.git_url,
        download_url: item.download_url,
        type: item.type,
        content: item.content,
        encoding: item.encoding,
      }));
  }

  private filterFiles(files: GitHubContentItem[]): GitHubContentItem[] {
    return files.filter((file) => {
      // Filter by file extensions if specified
      if (this.fileExtensions.length > 0 && file.type === 'file') {
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (!extension || !this.fileExtensions.includes(extension)) {
          return false;
        }
      }

      // Exclude paths if specified
      if (this.excludePaths.length > 0) {
        for (const excludePath of this.excludePaths) {
          if (file.path.includes(excludePath)) {
            return false;
          }
        }
      }

      return true;
    });
  }
}