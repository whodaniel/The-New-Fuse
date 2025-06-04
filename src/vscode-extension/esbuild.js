const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

console.log(`🔧 Building The New Fuse Extension...`);
console.log(`📊 Mode: ${production ? 'Production' : 'Development'}`);
console.log(`👀 Watch: ${watch ? 'Enabled' : 'Disabled'}`);

const esbuildProblemMatcherPlugin = {
  name: 'esbuild-problem-matcher',
  setup(build) {
    build.onStart(() => {
      console.log('🚀 [watch] build started');
    });
    build.onEnd((result) => {
      if (result.errors.length > 0) {
        console.log('❌ Build completed with errors:');
        result.errors.forEach(({ text, location }) => {
          console.error(`   ✘ [ERROR] ${text}`);
          if (location) {
            console.error(`     ${location.file}:${location.line}:${location.column}:`);
          }
        });
      } else {
        console.log('✅ [watch] build finished successfully');
      }
      
      if (result.warnings.length > 0) {
        console.log('⚠️  Build warnings:');
        result.warnings.forEach(({ text, location }) => {
          console.warn(`   ⚠️  [WARNING] ${text}`);
          if (location) {
            console.warn(`     ${location.file}:${location.line}:${location.column}`);
          }
        });
      }
    });
  },
};

const cleanupPlugin = {
  name: 'cleanup',
  setup(build) {
    build.onStart(() => {
      const distPath = path.resolve(__dirname, 'dist');
      if (fs.existsSync(distPath)) {
        fs.rmSync(distPath, { recursive: true, force: true });
      }
      fs.mkdirSync(distPath, { recursive: true });
    });
  },
};

async function main() {
  try {
    const entryPoint = path.resolve(__dirname, 'src', 'extension.ts');
    if (!fs.existsSync(entryPoint)) {
      throw new Error(`Entry point not found: ${entryPoint}`);
    }

    console.log(`📁 Entry point: ${entryPoint}`);
    
    const buildOptions = {
      entryPoints: [entryPoint],
      bundle: true,
      format: 'cjs',
      minify: production,
      sourcemap: !production,
      sourcesContent: false,
      platform: 'node',
      outfile: path.resolve(__dirname, 'dist', 'extension.js'),
      external: ['vscode', 'electron'],
      logLevel: 'silent',
      plugins: [cleanupPlugin, esbuildProblemMatcherPlugin],
      define: {
        'process.env.NODE_ENV': production ? '"production"' : '"development"',
        'process.env.EXTENSION_MODE': '"vscode"'
      },
      target: 'node16',
      loader: {
        '.ts': 'ts',
        '.js': 'js',
        '.json': 'json'
      },
      resolveExtensions: ['.ts', '.js', '.json'],
      mainFields: ['module', 'main'],
      conditions: ['node'],
      metafile: true,
      write: true,
      treeShaking: production,
      keepNames: !production,
      banner: {
        js: production ? '' : '// The New Fuse VS Code Extension - Development Build'
      }
    };

    const ctx = await esbuild.context(buildOptions);

    if (watch) {
      console.log('👀 Starting watch mode...');
      await ctx.watch();
      console.log('✅ Watching for changes...');
      
      process.on('SIGINT', async () => {
        console.log('\n🛑 Stopping watch mode...');
        await ctx.dispose();
        process.exit(0);
      });
    } else {
      console.log('🔨 Building...');
      const result = await ctx.rebuild();
      
      await ctx.dispose();
      console.log('✅ Build complete!');
      
      const outfile = path.resolve(__dirname, 'dist', 'extension.js');
      if (fs.existsSync(outfile)) {
        const stats = fs.statSync(outfile);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`📦 Bundle size: ${sizeKB} KB`);
        console.log(`📄 Output file: ${outfile}`);
      } else {
        throw new Error('Output file was not created');
      }
    }
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    if (error.stack && !production) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main();
