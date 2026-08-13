import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve('apps/frontend/src');
const ROUTER_FILE = path.join(SRC_DIR, 'ComprehensiveRouter.tsx');

const routerContent = fs.readFileSync(ROUTER_FILE, 'utf-8');

console.log('1. Verifying lazy imports...');
const importRegex = /lazy\(\(\) => import\(['"]([^'"]+)['"]\)/g;
let match;
let missingImports = 0;
while ((match = importRegex.exec(routerContent)) !== null) {
  const importPath = match[1];
  let resolvedPath = path.join(SRC_DIR, importPath);
  
  if (resolvedPath.endsWith('.tsx')) {
    if (!fs.existsSync(resolvedPath)) {
      console.error(`❌ Missing file: ${importPath}`);
      missingImports++;
    }
  } else {
    // Try .tsx, .ts, /index.tsx
    if (!fs.existsSync(resolvedPath + '.tsx') && !fs.existsSync(resolvedPath + '.ts') && !fs.existsSync(path.join(resolvedPath, 'index.tsx'))) {
      console.error(`❌ Missing file: ${importPath} (tried .tsx, .ts, /index.tsx)`);
      missingImports++;
    }
  }
}
if (missingImports === 0) {
  console.log('✅ All lazy imports resolve successfully.');
}

// 2. Extract all defined routes
console.log('\n2. Extracting defined routes...');
const routeRegex = /<Route[^>]*path=['"]([^'"]+)['"]/g;
const definedRoutes = new Set<string>();
while ((match = routeRegex.exec(routerContent)) !== null) {
  definedRoutes.add(match[1]);
}
console.log(`Found ${definedRoutes.size} defined routes.`);

// 3. Scan all files for Links
console.log('\n3. Verifying Links and Navigations...');
const allFiles = (dir: string): string[] => {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(allFiles(fullPath));
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      results.push(fullPath);
    }
  });
  return results;
};

const srcFiles = allFiles(SRC_DIR);
const linkRegex = /<Link[^>]*to=['"]([^'"]+)['"]/g;
const navRegex = /<Navigate[^>]*to=['"]([^'"]+)['"]/g;
const navigateRegex = /navigate\(['"]([^'"]+)['"]\)/g;

let brokenLinks = 0;

// simple path matcher taking into account params like /agents/:id
const isRouteMatched = (target: string) => {
  if (target.startsWith('http')) return true; // external link
  if (target.startsWith('#')) return true; // hash link
  if (target.startsWith('mailto:')) return true;
  
  // Remove query params and hashes for route matching
  const cleanTarget = target.split('?')[0].split('#')[0];
  
  if (definedRoutes.has(cleanTarget)) return true;
  if (cleanTarget === '') return true;
  
  // check params
  for (const route of definedRoutes) {
    const routeParts = route.split('/');
    const targetParts = cleanTarget.split('/');
    if (routeParts.length === targetParts.length) {
      let match = true;
      for (let i = 0; i < routeParts.length; i++) {
        if (routeParts[i].startsWith(':')) continue; // param matches anything
        if (routeParts[i].endsWith('*')) return true; // wildcard matches anything
        if (routeParts[i] !== targetParts[i]) {
          match = false;
          break;
        }
      }
      if (match) return true;
    } else if (route.endsWith('*')) {
      const baseRoute = route.replace('/*', '');
      if (cleanTarget.startsWith(baseRoute)) return true;
    }
  }
  return false;
}

srcFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  
  // Check <Link to="...">
  let m;
  while ((m = linkRegex.exec(content)) !== null) {
    if (!isRouteMatched(m[1])) {
      console.error(`❌ Broken Link in ${path.relative(SRC_DIR, file)}: <Link to="${m[1]}">`);
      brokenLinks++;
    }
  }
  
  // Check <Navigate to="...">
  while ((m = navRegex.exec(content)) !== null) {
    if (!isRouteMatched(m[1])) {
      console.error(`❌ Broken Navigate in ${path.relative(SRC_DIR, file)}: <Navigate to="${m[1]}">`);
      brokenLinks++;
    }
  }

  // Check navigate('...')
  while ((m = navigateRegex.exec(content)) !== null) {
    if (!isRouteMatched(m[1]) && !m[1].startsWith('/') && m[1] !== '-1') {
      // Relative navigate might be fine, but we'll flag absolute ones
      if (m[1].startsWith('/')) {
        console.error(`❌ Broken navigate() in ${path.relative(SRC_DIR, file)}: navigate('${m[1]}')`);
        brokenLinks++;
      }
    }
  }
});

if (brokenLinks === 0) {
  console.log('✅ All internal links seem valid.');
} else {
  console.log(`\nFound ${brokenLinks} potentially broken links.`);
}

