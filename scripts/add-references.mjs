import { readdir, readFile, writeFile } from 'fs/promises';
import { join, relative } from 'path';

const packagesDir = join(process.cwd(), 'packages');

async function getPackageDependencies(packagePath) {
  const packageJsonPath = join(packagePath, 'package.json');
  try {
    const packageJsonContent = await readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    return Object.keys(dependencies)
      .filter((dep) => dep.startsWith('@the-new-fuse/'))
      .map((dep) => dep.replace('@the-new-fuse/', ''));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function updateTsConfig(packagePath, dependencies) {
  const tsconfigPath = join(packagePath, 'tsconfig.json');
  try {
    const tsconfigContent = await readFile(tsconfigPath, 'utf-8');
    const tsconfig = JSON.parse(tsconfigContent);

    const references = dependencies.map((dep) => ({
      path: relative(packagePath, join(packagesDir, dep)).replace(/\\/g, '/'),
    }));

    if (references.length > 0) {
      tsconfig.references = [...(tsconfig.references || []), ...references];
      // Remove duplicates
      tsconfig.references = tsconfig.references.filter(
        (ref, index, self) =>
          index === self.findIndex((r) => r.path === ref.path)
      );
    }


    await writeFile(tsconfigPath, JSON.stringify(tsconfig, null, 2) + '\n');
    console.log(`Updated tsconfig.json for ${relative(process.cwd(), packagePath)}`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // No tsconfig.json, skip
    } else {
      console.error(`Error updating tsconfig.json for ${relative(process.cwd(), packagePath)}:`, error);
    }
  }
}

async function main() {
  const packageDirs = await readdir(packagesDir, { withFileTypes: true });
  for (const dirent of packageDirs) {
    if (dirent.isDirectory()) {
      const packagePath = join(packagesDir, dirent.name);
      const dependencies = await getPackageDependencies(packagePath);
      if (dependencies.length > 0) {
        await updateTsConfig(packagePath, dependencies);
      }
    }
  }
}

main().catch(console.error);