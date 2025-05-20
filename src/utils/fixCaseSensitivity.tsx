// filepath: src/utils/fixCaseSensitivity.ts
import fs from "fs";
import path from "path";

// Map of problematic imports to their correct paths
const importMappings: Record<string, string> = {
  "../monitoring/metricsCollector": "../monitoring/MetricsCollector",
  "./metricsCollector": "./MetricsCollector",
  "../database/databaseManager": "../database/DatabaseManager",
  "../memory/MemoryCache": "../memory/memoryCache",
};

function processFile(filePath: string): void {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    let modified = false;

    for (const [incorrectPath, correctPath] of Object.entries(importMappings)) {
      const importRegex = new RegExp(`from ['"]${incorrectPath}['"]`, "g");
      if (importRegex.test(content)) {
        content = content.replace(
          importRegex,
          `from '${correctPath}'`
        );
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`Fixed imports in ${filePath}`);
    }
  } catch (error: unknown) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

function scanDirectory(directory: string): void {
  try {
    const files = fs.readdirSync(directory);

    for (const file of files) {
      const fullPath = path.join(directory, file);

      try {
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (
          file.endsWith(".ts") ||
          file.endsWith(".tsx")
        ) {
          processFile(fullPath);
        }
      } catch (error: unknown) {
        console.error(`Error processing ${fullPath}:`, error);
      }
    }
  } catch (error: unknown) {
    console.error(`Error scanning directory ${directory}:`, error);
  }
}

// Start from the src directory
scanDirectory("src");

export {};
