export interface FileInfo {
    path: string;
    name: string;
    extension: string;
    type: FileType;
    size: number;
    lastModified: Date;
    packagePath?: string;
    isSource: boolean;
    isTest: boolean;
    isConfig: boolean;
    isDocumentation: boolean;
}
export interface PackageInfo {
    name: string;
    path: string;
    type: PackageType;
    packageJson?: any;
    files: FileInfo[];
    sourceFiles: FileInfo[];
    testFiles: FileInfo[];
    configFiles: FileInfo[];
    documentationFiles: FileInfo[];
}
export interface FileSystemMap {
    rootPath: string;
    totalFiles: number;
    packages: PackageInfo[];
    apps: PackageInfo[];
    rootFiles: FileInfo[];
    scanTimestamp: Date;
}
export declare enum FileType {
    SOURCE = "source",
    TEST = "test",
    CONFIG = "config",
    DOCUMENTATION = "documentation",
    BUILD = "build",
    ASSET = "asset",
    OTHER = "other"
}
export declare enum PackageType {
    APP = "app",
    PACKAGE = "package",
    TOOL = "tool",
    LIBRARY = "library"
}
export declare class FileSystemScanner {
    private rootPath;
    private excludePatterns;
    constructor(rootPath?: string);
    scanFileSystem(): Promise<FileSystemMap>;
    private scanPackages;
    private scanApps;
    private scanRootFiles;
    private analyzePackage;
    private scanPackageFiles;
    private analyzeFile;
    private classifyFileType;
    private isSourceFile;
    private isTestFile;
    private isConfigFile;
    private isDocumentationFile;
    private isBuildFile;
    private isAssetFile;
    private getDirectories;
}
//# sourceMappingURL=FileSystemScanner.d.ts.map