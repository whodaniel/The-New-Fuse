import fs from "fs";
import path from "path";

console.log("Running comprehensive quote fix for remaining files...");

function fixQuotesInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    let fixCount = 0;

    // Save original for comparison
    const originalContent = content;

    // Fix unterminated string literals
    content = content.replace(/['"]['"][^'"]*$/gm, (match) => {
      fixCount++;
      return '"' + match.substring(2) + '"';
    });

    // Fix missing opening quotes in imports
    content = content.replace(
      /import\s+([^'";\s{][^;]*);/g,
      (match, importPath) => {
        if (
          !importPath.includes('"') &&
          !importPath.includes("'") &&
          !importPath.includes("{")
        ) {
          fixCount++;
          return `import "${importPath.trim()}";`;
        }
        return match;
      },
    );

    // Fix export statements with missing quotes
    content = content.replace(
      /export\s*\*\s*from\s*([^'"][^;]*);/g,
      (match, exportPath) => {
        if (!exportPath.startsWith('"') && !exportPath.startsWith("'")) {
          fixCount++;
          return `export * from "${exportPath.trim()}";`;
        }
        return match;
      },
    );

    // Fix string literals that lost their closing quote
    content = content.replace(/:\s*['"]['"][^'"]*$/gm, (match) => {
      if (!match.endsWith('"') && !match.endsWith("'")) {
        fixCount++;
        return match + '"';
      }
      return match;
    });

    // Write back if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, "utf8");
      if (fixCount > 0) {
        console.log(`Fixed ${fixCount} issues in: ${filePath}`);
      }
    }

    return fixCount;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return 0;
  }
}

function findAndFixFiles(dir, extensions = [".ts", ".tsx"]) {
  let totalFixes = 0;
  let fileCount = 0;

  function walkDir(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (
        stat.isDirectory() &&
        !item.includes("node_modules") &&
        !item.includes(".git")
      ) {
        walkDir(fullPath);
      } else if (
        stat.isFile() &&
        extensions.some((ext) => item.endsWith(ext))
      ) {
        const fixes = fixQuotesInFile(fullPath);
        totalFixes += fixes;
        fileCount++;

        if (fileCount % 100 === 0) {
          console.log(
            `Processed ${fileCount} files, applied ${totalFixes} fixes so far...`,
          );
        }
      }
    }
  }

  walkDir(dir);
  return { totalFixes, fileCount };
}

// Process apps and packages directories
console.log("Processing apps directory...");
const appsResult = findAndFixFiles("./apps");

console.log("Processing packages directory...");
const packagesResult = findAndFixFiles("./packages");

const totalFixes = appsResult.totalFixes + packagesResult.totalFixes;
const totalFiles = appsResult.fileCount + packagesResult.fileCount;

console.log(`\nCompleted processing ${totalFiles} files`);
console.log(`Applied ${totalFixes} total fixes`);
console.log("Final quote corruption fix complete!");
