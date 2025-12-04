/**
    Browser-compatible file system utility
  This module provides a browser-friendly implementation of directory structure creation
  */
// Define browser-compatible path utilities
var pathUtils = {
    join: function () {
        var paths = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            paths[_i] = arguments[_i];
        }
        return paths.join('/').replace(/\/+/g, '/');
    },
    basename: function (path) { return path.split('/').pop() || ''; },
    dirname: function (path) {
        var parts = path.split('/');
        parts.pop();
        return parts.join('/');
    },
    extname: function (path) {
        var basename = pathUtils.basename(path);
        var lastDotIndex = basename.lastIndexOf('.');
        return lastDotIndex === -1 ? '' : basename.slice(lastDotIndex);
    }
};
// Define browser-compatible file system utilities
var fsUtils = {
    existsSync: function (_path) {
        return false; // In browser, we'll assume paths don't exist
    },
    mkdirSync: function (_path, _options) {
        // In browser, we'll just log the operation
    },
    writeFileSync: function (_path, _content) {
        // In browser, we'll just log the operation
    }
};
// Use the browser-compatible utilities
var fs = fsUtils;
var path = pathUtils;
export function createDirectoryStructure(rootPath) {
    // Directory structure definition
    var directories = {
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
    // Create directories recursively
    createDirectories(rootPath, directories);
    // Create template files
    createTemplateFiles(rootPath);
}
function createDirectories(basePath, structure) {
    if (Array.isArray(structure)) {
        structure.forEach(function (dir) {
            var dirPath = path.join(basePath, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
        });
    }
    else {
        Object.entries(structure).forEach(function (_a) {
            var dir = _a[0], subStructure = _a[1];
            var dirPath = path.join(basePath, dir);
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
    var templates = {
        'README.md': "# Project Name\n\nProject description goes here.\n\n## Setup\n\n1. Installation steps\n2. Configuration\n3. Running the application\n\n## Development\n\n- Development guidelines\n- Code style\n- Testing\n\n## Deployment\n\n- Deployment process\n- Environment setup\n\n## Documentation\n\n- API documentation\n- Architecture overview\n- Component documentation\n",
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
                typescript: '^4.3.5',
                '@types/node': '^14.14.31',
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
    Object.entries(templates).forEach(function (_a) {
        var filename = _a[0], content = _a[1];
        var filePath = path.join(rootPath, filename);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, content);
        }
    });
}
// Run if this is the main module
// if (require.main === module) {
//   const rootPath = process.argv[2] || path.join(__dirname, '..');
//   createDirectoryStructure(rootPath);
// }
