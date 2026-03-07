#!/usr/bin/env node

import fs from "fs";
import path from "path";

console.log("📊 Package Dependency Analysis");
console.log("==============================");

const packageDirs = ["packages", "apps", "tools"];

const packages = [];
const dependencies = new Map();

// Scan all packages
packageDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) return;

  const items = fs.readdirSync(dir);
  items.forEach((item) => {
    const packagePath = path.join(dir, item, "package.json");
    if (fs.existsSync(packagePath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
        if (pkg.name) {
          packages.push({
            name: pkg.name,
            path: path.join(dir, item),
            dependencies: {
              ...pkg.dependencies,
              ...pkg.devDependencies,
            },
          });
        }
      } catch (e) {
        console.warn(`⚠️  Could not parse ${packagePath}`);
      }
    }
  });
});

console.log(`Found ${packages.length} packages`);

// Analyze internal dependencies
const internalDeps = new Map();
packages.forEach((pkg) => {
  const internal = [];
  Object.keys(pkg.dependencies || {}).forEach((dep) => {
    if (dep.startsWith("@the-new-fuse/")) {
      internal.push(dep);
    }
  });
  if (internal.length > 0) {
    internalDeps.set(pkg.name, internal);
  }
});

console.log("\n🔗 Internal Dependencies:");
internalDeps.forEach((deps, pkg) => {
  console.log(`  ${pkg}:`);
  deps.forEach((dep) => console.log(`    - ${dep}`));
});

// Suggest build order
console.log("\n📋 Suggested Build Order:");
console.log("  1. Types packages");
console.log("  2. Utility packages");
console.log("  3. Core packages");
console.log("  4. Database packages");
console.log("  5. API packages");
console.log("  6. UI packages");
console.log("  7. Feature packages");
console.log("  8. Application packages");
