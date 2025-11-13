const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("Running comprehensive quote fix for remaining files...");

function fixQuotesInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    let fixCount = 0;

    // Save original for comparison
    const originalContent = content;

    // Fix corrupted import statements
    content = content.replace(/import\s*['"]['"][^'"]*;/g, (match) => {
      fixCount++;
      return match.replace(/['"]['"]/, '"');
    });

    // Fix missing quotes in import statements
    content = content.replace(/import\s+([^'";\s]+);/g, (match, path) => {
      if (!path.includes('"') && !path.includes("'")) {
        fixCount++;
        return `import "${path}";`;
      }
      return match;
    });

    // Fix corrupted string literals
    content = content.replace(/['"]['"][^'"]*$/gm, (match) => {
      fixCount++;
      return match.replace(/['"]['"]/, '"') + '"';
    });

    // Fix unterminated strings at end of lines
    content = content.replace(/['"]['"][^'"]*$/gm, (match) => {
      if (!match.endsWith('"') && !match.endsWith("'")) {
        fixCount++;
        return match + '"';
      }
      return match;
    });

    // Fix corrupted export statements
    content = content.replace(/export\s*\*\s*from\s*[^'"][^;]*;/g, (match) => {
      const pathMatch = match.match(/from\s+([^;]+);/);
      if (
        pathMatch &&
        !pathMatch[1].startsWith('"') &&
        !pathMatch[1].startsWith("'")
      ) {
        fixCount++;
        return match.replace(
          /from\s+([^;]+);/,
          `from "${pathMatch[1].trim()}";`,
        );
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
console.log("Additional quote corruption fix complete!");
