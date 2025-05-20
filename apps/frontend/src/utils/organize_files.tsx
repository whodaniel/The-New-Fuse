import * as path from 'path';
export function createDirectoryStructure(rootPath) {
    const directories = {
        src: {
            core: ['error', 'logging', 'config', 'utils'],
            api: ['routes', 'models', 'schemas'],
            services: ['auth', 'messaging', 'monitoring'],
            utils: ['helpers', 'validators']
        },
        frontend: {
            src: [
                'components',
                'pages',
                'services',
                'utils',
                'hooks',
                'context',
                'styles',
                'assets'
            ]
        },
        tests: {
            unit: ['models', 'api', 'services'],
            integration: ['api', 'services'],
            e2e: []
        },
        docs: [
            'api',
            'architecture',
            'deployment',
            'development'
        ],
        scripts: [],
        dist: [],
        data: ['schemas', 'config', 'temp'],
        config: ['development', 'production', 'testing']
    };
    createDirectories(rootPath, directories);
    createTemplateFiles(rootPath);
    
}
function createDirectories(basePath, structure) {
    if (Array.isArray(structure)) {
        structure.forEach(dir => {
            const dirPath = path.join(basePath, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
        });
    }
    else {
        Object.entries(structure).forEach(([dir, subStructure]) => {
            const dirPath = path.join(basePath, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
            if (subStructure) {
                createDirectories(dirPath, subStructure);
            }
        });
    }
}
function createTemplateFiles(rootPath) {
    const templates = {
        'README.md': `# Project Name\n\nProject description goes here.\n\n## Setup\n\n1. Installation steps\n2. Configuration\n3. Running the application\n\n## Development\n\n- Development guidelines\n- Code style\n- Testing\n\n## Deployment\n\n- Deployment process\n- Environment setup\n\n## Documentation\n\n- API documentation\n- Architecture overview\n- Component documentation\n`,
        'package.json': JSON.stringify({
            name: 'your-project-name',
            version: '1.0.0',
            description: 'A brief description of your project goes here',
            main: 'dist/index.js',
            scripts: {
                build: 'tsc',
                start: 'node dist/index.js',
                dev: 'ts-node src/index.ts',
                test: 'jest',
                lint: 'eslint src/**/*.ts'
            },
            dependencies: {
                express: '^4.17.1',
                typescript: '^4.3.5',
                '@types/node': '^14.14.31',
                '@types/express': '^4.17.11',
                dotenv: '^10.0.0',
                jest: '^27.0.6',
                'ts-jest': '^27.0.3'
            }
        }, null, 2),
        'tsconfig.json': JSON.stringify({
            compilerOptions: {
                target: 'ES2020',
                module: 'CommonJS',
                lib: ['ES2020'],
                strict: true,
                outDir: 'dist',
                rootDir: 'src',
                esModuleInterop: true,
                skipLibCheck: true,
                forceConsistentCasingInFileNames: true,
                moduleResolution: 'node',
                resolveJsonModule: true,
                declaration: true,
                sourceMap: true
            },
            include: ['src/**/*'],
            exclude: ['node_modules', 'dist', 'test']
        }, null, 2)
    };
    Object.entries(templates).forEach(([filename, content]) => {
        const filePath = path.join(rootPath, filename);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, content);
        }
    });
}
if (require.main === module) {
    const rootPath = process.argv[2] || path.join(__dirname, '..');
    createDirectoryStructure(rootPath);
}
//# sourceMappingURL=organize_files.js.map