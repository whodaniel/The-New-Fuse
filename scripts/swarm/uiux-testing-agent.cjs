#!/usr/bin/env node
/**
 * TNF UI/UX Testing Agent
 *
 * Specializes in testing user interface quality, accessibility,
 * and design consistency across the application.
 */

const { singleInstanceGuard } = require('../lib/tnf-single-instance-guard.cjs');
const _guard = singleInstanceGuard({ lockName: 'uiux-testing-agent', staleMs: 10 * 60 * 1000 });
if (!_guard.acquired) {
  console.log(JSON.stringify({ ok: true, skipped: 'already-running', lock: _guard.existingLock }));
  process.exit(0);
}

const fs = require('fs');
const path = require('path');

// Load environment
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const separatorIndex = line.indexOf('=');
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const ROOT_DIR = path.resolve(__dirname, '../..');
loadEnvFile(path.join(ROOT_DIR, '.env.local'));
loadEnvFile(path.join(ROOT_DIR, '.env'));

// Test results
const results = {
  timestamp: new Date().toISOString(),
  components: { passed: 0, failed: 0, errors: [] },
  accessibility: { passed: 0, failed: 0, errors: [] },
  design: { passed: 0, failed: 0, errors: [] },
  routing: { passed: 0, failed: 0, errors: [] },
  overall: { score: 0, status: 'unknown' },
};

const log = {
  header: (msg) => console.log(`\n${'='.repeat(60)}\n  ${msg}\n${'='.repeat(60)}`),
  section: (msg) => console.log(`\n🎨 ${msg}`),
  success: (msg) => console.log(`  ✅ ${msg}`),
  error: (msg) => console.log(`  ❌ ${msg}`),
  warn: (msg) => console.log(`  ⚠️ ${msg}`),
  info: (msg) => console.log(`  ℹ️ ${msg}`),
};

// Test component structure
function testComponents() {
  log.section('Component Structure Check');

  const frontendDir = path.join(ROOT_DIR, 'apps/frontend/src');
  if (!fs.existsSync(frontendDir)) {
    log.error('Frontend src directory not found');
    results.components.failed++;
    return false;
  }

  // Check for key component directories
  const componentDirs = ['components', 'shared/ui', 'shared/components', 'pages'];

  let totalComponents = 0;

  for (const dir of componentDirs) {
    const fullPath = path.join(frontendDir, dir);
    if (fs.existsSync(fullPath)) {
      // Count component files
      const countFiles = (d) => {
        let count = 0;
        const entries = fs.readdirSync(d, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            count += countFiles(path.join(d, entry.name));
          } else if (
            entry.name.endsWith('.tsx') &&
            !entry.name.includes('.test.') &&
            !entry.name.includes('.spec.')
          ) {
            count++;
          }
        }
        return count;
      };

      const count = countFiles(fullPath);
      if (count > 0) {
        log.success(`${dir}: ${count} components`);
        totalComponents += count;
        results.components.passed++;
      }
    }
  }

  if (totalComponents > 50) {
    log.success(`Total: ${totalComponents} components found`);
    results.components.passed++;
  } else if (totalComponents > 20) {
    log.info(`Total: ${totalComponents} components (moderate)`);
    results.components.passed++;
  } else {
    log.warn(`Total: ${totalComponents} components (low)`);
    results.components.passed++;
  }

  return results.components.failed === 0;
}

// Test accessibility features
function testAccessibility() {
  log.section('Accessibility Check');

  const frontendDir = path.join(ROOT_DIR, 'apps/frontend/src');

  // Check for accessibility-related files and patterns
  const a11yPatterns = [
    { name: 'ARIA components', pattern: /aria-/gi },
    { name: 'Role attributes', pattern: /role=/gi },
    { name: 'Alt text', pattern: /alt=/gi },
    { name: 'Focus management', pattern: /focus|tabIndex/gi },
  ];

  const checkDir = (dir) => {
    const results = {};
    for (const pattern of a11yPatterns) {
      results[pattern.name] = 0;
    }

    if (!fs.existsSync(dir)) return results;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subResults = checkDir(path.join(dir, entry.name));
        for (const pattern of a11yPatterns) {
          results[pattern.name] += subResults[pattern.name];
        }
      } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
        const content = fs.readFileSync(path.join(dir, entry.name), 'utf8');
        for (const pattern of a11yPatterns) {
          const matches = content.match(pattern.pattern);
          if (matches) {
            results[pattern.name] += matches.length;
          }
        }
      }
    }
    return results;
  };

  const a11yResults = checkDir(frontendDir);

  for (const [name, count] of Object.entries(a11yResults)) {
    if (count > 0) {
      log.success(`${name}: ${count} instances`);
      results.accessibility.passed++;
    } else {
      log.warn(`${name}: not found`);
    }
  }

  // Check for accessibility testing libraries
  const packageJson = path.join(ROOT_DIR, 'apps/frontend/package.json');
  if (fs.existsSync(packageJson)) {
    const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (deps['@testing-library/jest-dom']) {
      log.success('jest-dom testing library installed');
      results.accessibility.passed++;
    }

    if (deps['jest-axe'] || deps['axe-core']) {
      log.success('Axe accessibility testing installed');
      results.accessibility.passed++;
    }
  }

  return results.accessibility.failed === 0;
}

// Test design consistency
function testDesign() {
  log.section('Design Consistency Check');

  const frontendDir = path.join(ROOT_DIR, 'apps/frontend');

  // Check for design system files
  const designFiles = [
    'tailwind.config.js',
    'tailwind.config.ts',
    'src/styles/globals.css',
    'src/styles/theme.ts',
    'src/shared/ui',
  ];

  for (const file of designFiles) {
    const fullPath = path.join(frontendDir, file);
    if (fs.existsSync(fullPath)) {
      log.success(`${file} exists`);
      results.design.passed++;
    }
  }

  // Check for UI package
  const uiPackage = path.join(ROOT_DIR, 'packages/ui-consolidated');
  if (fs.existsSync(uiPackage)) {
    log.success('UI package exists');
    results.design.passed++;

    // Count UI components
    const srcDir = path.join(uiPackage, 'src');
    if (fs.existsSync(srcDir)) {
      const countFiles = (d) => {
        let count = 0;
        const entries = fs.readdirSync(d, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            count += countFiles(path.join(d, entry.name));
          } else if (entry.name.endsWith('.tsx') && !entry.name.includes('.test.')) {
            count++;
          }
        }
        return count;
      };

      const count = countFiles(srcDir);
      log.info(`UI package has ${count} components`);
      results.design.passed++;
    }
  }

  // Check for theme provider
  const themeFiles = [
    path.join(frontendDir, 'src/providers/ThemeProvider.tsx'),
    path.join(frontendDir, 'src/context/ThemeContext.tsx'),
    path.join(frontendDir, 'src/hooks/useTheme.ts'),
  ];

  for (const themeFile of themeFiles) {
    if (fs.existsSync(themeFile)) {
      log.success(`Theme file: ${path.basename(themeFile)}`);
      results.design.passed++;
    }
  }

  return results.design.failed === 0;
}

// Test routing structure
function testRouting() {
  log.section('Routing Structure Check');

  const frontendDir = path.join(ROOT_DIR, 'apps/frontend/src');

  // Check for route files
  const routeLocations = ['routes/index.tsx', 'routes/routes.tsx', 'router/index.tsx', 'App.tsx'];

  for (const loc of routeLocations) {
    const fullPath = path.join(frontendDir, loc);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');

      // Count Route components
      const routeMatches = content.match(/<Route/g);
      if (routeMatches) {
        log.success(`${loc}: ${routeMatches.length} routes defined`);
        results.routing.passed++;
      } else {
        log.info(`${loc} exists (routes may be defined elsewhere)`);
        results.routing.passed++;
      }
    }
  }

  // Check for pages directory
  const pagesDir = path.join(frontendDir, 'pages');
  if (fs.existsSync(pagesDir)) {
    const countPages = (d) => {
      let count = 0;
      const entries = fs.readdirSync(d, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          count += countPages(path.join(d, entry.name));
        } else if (entry.name.endsWith('.tsx') && !entry.name.includes('.test.')) {
          count++;
        }
      }
      return count;
    };

    const pageCount = countPages(pagesDir);
    log.success(`Pages directory: ${pageCount} page components`);
    results.routing.passed++;
  }

  return results.routing.failed === 0;
}

// Calculate overall score
function calculateScore() {
  const totalPassed =
    results.components.passed +
    results.accessibility.passed +
    results.design.passed +
    results.routing.passed;
  const totalFailed =
    results.components.failed +
    results.accessibility.failed +
    results.design.failed +
    results.routing.failed;
  const total = totalPassed + totalFailed;

  results.overall.score = total > 0 ? Math.round((totalPassed / total) * 100) : 0;
  results.overall.status =
    results.overall.score >= 80
      ? 'healthy'
      : results.overall.score >= 60
        ? 'needs-attention'
        : 'critical';

  return results;
}

// Generate report
function generateReport() {
  log.header('UI/UX TEST RESULTS');

  console.log('\n📊 Components:');
  console.log(`   Passed: ${results.components.passed}`);
  console.log(`   Failed: ${results.components.failed}`);

  console.log('\n📊 Accessibility:');
  console.log(`   Passed: ${results.accessibility.passed}`);
  console.log(`   Failed: ${results.accessibility.failed}`);

  console.log('\n📊 Design:');
  console.log(`   Passed: ${results.design.passed}`);
  console.log(`   Failed: ${results.design.failed}`);

  console.log('\n📊 Routing:');
  console.log(`   Passed: ${results.routing.passed}`);
  console.log(`   Failed: ${results.routing.failed}`);

  console.log('\n📈 Overall Score:');
  console.log(`   ${results.overall.score}% - ${results.overall.status.toUpperCase()}`);

  // Save report with lifecycle metadata & rotation
  const { writeReportWithLifecycle } = require('./report-lifecycle.cjs');
  const { filePath, pruneResult } = writeReportWithLifecycle('uiux-report', results);
  log.info(`Report saved to: ${filePath}`);
  if (pruneResult.pruned > 0) {
    log.info(`Pruned ${pruneResult.pruned} old report(s), ${pruneResult.kept} remaining`);
  }

  return results;
}

// Main
async function main() {
  console.log('\n🎨 TNF UI/UX Testing Agent');
  console.log(`   Started: ${results.timestamp}`);

  try {
    testComponents();
    testAccessibility();
    testDesign();
    testRouting();
    calculateScore();
    generateReport();

    if (results.overall.status === 'critical') {
      console.log('\n🚨 CRITICAL: UI/UX issues detected!');
      process.exit(1);
    } else {
      console.log('\n✅ UI/UX tests completed.');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ UI/UX testing failed:', error.message);
    process.exit(1);
  }
}

main();
