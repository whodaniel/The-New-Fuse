#!/usr/bin/env node

/**
 * Navigation Validator
 * 
 * This tool validates navigation integrity across the application,
 * identifying broken links, orphaned routes, and inconsistent navigation flows.
 */

import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

// Configuration
const CONFIG = {
  rootDir: process.env.NAV_SCAN_DIR || process.cwd(),
  routePatterns: ['**/routes.{js,jsx,ts,tsx}', '**/router.{js,jsx,ts,tsx}', '**/navigation.{js,jsx,ts,tsx}'],
  linkPatterns: ['**/*.{jsx,tsx}'],
  reportFile: process.env.NAV_REPORT_FILE || 'navigation-report.md',
  excludeDirs: ['node_modules', 'dist', 'build', '.git'],
  detailedOutput: process.env.NAV_DETAILED === 'true'
};

// Main function
async function validateNavigation() {
  console.log(`\n🧭 Starting Navigation Validation in ${CONFIG.rootDir}\n`);
  
  try {
    // Step 1: Find all route definitions
    console.log('📍 Finding route definitions...');
    const routes = await findRouteDefinitions();
    console.log(`   Found ${routes.length} routes`);
    
    // Step 2: Find all navigation links
    console.log('🔗 Finding navigation links...');
    const links = await findNavigationLinks();
    console.log(`   Found ${links.length} links`);
    
    // Step 3: Validate links against routes
    console.log('✅ Validating links against routes...');
    const validationResults = validateLinks(routes, links);
    
    // Step 4: Generate route map
    console.log('🗺️ Generating navigation map...');
    const navigationMap = generateNavigationMap(routes, links);
    
    // Step 5: Generate report
    console.log('📝 Generating report...');
    const report = generateReport(routes, links, validationResults, navigationMap);
    
    // Save report
    fs.writeFileSync(
      path.join(process.cwd(), CONFIG.reportFile),
      report.join('\n')
    );
    
    console.log(`\n✅ Navigation validation complete`);
    console.log(`   Report saved to: ${CONFIG.reportFile}`);
    
    // Print summary of issues
    if (validationResults.brokenLinks.length > 0 || validationResults.orphanedRoutes.length > 0) {
      console.log('\n⚠️ Issues found:');
      console.log(`   ${validationResults.brokenLinks.length} broken links`);
      console.log(`   ${validationResults.orphanedRoutes.length} orphaned routes`);
    } else {
      console.log('\n🎉 No navigation issues found!');
    }
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    console.error(error);
  }
}

// Find all route definitions in the codebase
async function findRouteDefinitions() {
  try {
    const routes = [];
    
    // Prepare glob patterns with exclusions
    const patterns = CONFIG.routePatterns.map(pattern => {
      if (CONFIG.excludeDirs.length > 0) {
        return `${pattern},!{${CONFIG.excludeDirs.join(',')}}/**`;
      }
      return pattern;
    });
    
    // Find all route files
    const routeFiles = globSync(patterns, { cwd: CONFIG.rootDir });
    
    // Process each file
    for (const file of routeFiles) {
      const filePath = path.join(CONFIG.rootDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Find React Router route definitions
        // For older React Router (v5 and earlier)
        const routeMatches = content.matchAll(/<Route[^>]*path=["']([^"']+)["'][^>]*component=\{([^}]+)\}/g);
        for (const match of Array.from(routeMatches)) {
          routes.push({
            path: match[1],
            component: match[2],
            file: file,
            used: false // Will mark as true if any link points to this route
          });
        }
        
        // For React Router v6
        const routeV6Matches = content.matchAll(/<Route[^>]*path=["']([^"']+)["'][^>]*element=\{([^}]+)\}/g);
        for (const match of Array.from(routeV6Matches)) {
          routes.push({
            path: match[1],
            component: match[2],
            file: file,
            used: false
          });
        }
        
        // For object-based route definitions
        const objectRouteMatches = content.matchAll(/path:\s*["']([^"']+)["']/g);
        for (const match of Array.from(objectRouteMatches)) {
          // Try to extract component name if available
          let componentMatch = null;
          if (content.includes('component:')) {
            const componentRegex = new RegExp(`path:\\s*["']${match[1]}["'][^}]*component:\\s*([\\w.]+)`, 'g');
            componentMatch = componentRegex.exec(content);
          } else if (content.includes('element:')) {
            const elementRegex = new RegExp(`path:\\s*["']${match[1]}["'][^}]*element:\\s*<([\\w.]+)`, 'g');
            componentMatch = elementRegex.exec(content);
          }
          
          routes.push({
            path: match[1],
            component: componentMatch ? componentMatch[1] : 'Unknown',
            file: file,
            used: false
          });
        }
        
        // For Next.js file-based routing, infer route from filename
        if (file.includes('/pages/') || file.includes('/app/')) {
          let routePath = file
            .replace(/^pages\//, '/')
            .replace(/^app\//, '/')
            .replace(/\.(js|jsx|ts|tsx)$/, '')
            .replace(/\/index$/, '/');
          
          if (!routes.some(r => r.path === routePath)) {
            routes.push({
              path: routePath,
              component: path.basename(file, path.extname(file)),
              file: file,
              used: false,
              type: 'next.js'
            });
          }
        }
      } catch (error) {
        console.warn(`   Warning: Could not process route file ${file}: ${error.message}`);
      }
    }
    
    return routes;
  } catch (error) {
    console.error(`Error finding route definitions: ${error.message}`);
    return [];
  }
}

// Find all navigation links in the codebase
async function findNavigationLinks() {
  try {
    const links = [];
    
    // Prepare glob patterns with exclusions
    const patterns = CONFIG.linkPatterns.map(pattern => {
      if (CONFIG.excludeDirs.length > 0) {
        return `${pattern},!{${CONFIG.excludeDirs.join(',')}}/**`;
      }
      return pattern;
    });
    
    // Find all files that might contain links
    const linkFiles = globSync(patterns, { cwd: CONFIG.rootDir });
    
    // Process each file
    for (const file of linkFiles) {
      const filePath = path.join(CONFIG.rootDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Find React Router Link components
        const linkMatches = content.matchAll(/<Link[^>]*to=["']([^"']+)["'][^>]*/g);
        for (const match of Array.from(linkMatches)) {
          links.push({
            to: match[1],
            file: file,
            isValid: false // Will mark as true if a route is found for this link
          });
        }
        
        // Find Next.js Link components
        const nextLinkMatches = content.matchAll(/<Link[^>]*href=["']([^"']+)["'][^>]*/g);
        for (const match of Array.from(nextLinkMatches)) {
          links.push({
            to: match[1],
            file: file,
            isValid: false,
            type: 'next.js'
          });
        }
        
        // Find programmatic navigation (useNavigate)
        const navigateMatches = content.matchAll(/navigate\(["']([^"']+)["']\)/g);
        for (const match of Array.from(navigateMatches)) {
          links.push({
            to: match[1],
            file: file,
            isValid: false,
            type: 'programmatic'
          });
        }
        
        // Find programmatic navigation (history.push)
        const historyMatches = content.matchAll(/history\.push\(["']([^"']+)["']\)/g);
        for (const match of Array.from(historyMatches)) {
          links.push({
            to: match[1],
            file: file,
            isValid: false,
            type: 'history'
          });
        }
      } catch (error) {
        console.warn(`   Warning: Could not process link file ${file}: ${error.message}`);
      }
    }
    
    return links;
  } catch (error) {
    console.error(`Error finding navigation links: ${error.message}`);
    return [];
  }
}

// Validate links against defined routes
function validateLinks(routes, links) {
  const results = {
    brokenLinks: [],
    orphanedRoutes: []
  };
  
  // Check each link
  for (const link of links) {
    let isExternal = link.to.startsWith('http') || link.to.startsWith('//');
    let isDynamic = link.to.includes(':') || link.to.includes('*') || link.to.includes('[');
    
    // Skip validation for external links, dynamic segments, and hash/query links
    if (isExternal || link.to.startsWith('#')) {
      link.isValid = true;
      continue;
    }
    
    // Normalize the path
    let normalizedPath = link.to;
    if (normalizedPath.includes('?')) {
      normalizedPath = normalizedPath.split('?')[0];
    }
    if (normalizedPath.includes('#')) {
      normalizedPath = normalizedPath.split('#')[0];
    }
    
    // Check if this link matches any route
    let matchFound = false;
    for (const route of routes) {
      if (normalizedPath === route.path) {
        matchFound = true;
        link.isValid = true;
        route.used = true;
        break;
      }
      
      // Handle dynamic routes
      if (isDynamic && route.path.includes(':')) {
        const routePattern = route.path.replace(/:[^/]+/g, '[^/]+');
        const regex = new RegExp(`^${routePattern}$`);
        if (regex.test(normalizedPath)) {
          matchFound = true;
          link.isValid = true;
          route.used = true;
          break;
        }
      }
    }
    
    // If no match found, add to broken links
    if (!matchFound && !isDynamic) {
      results.brokenLinks.push(link);
    }
  }
  
  // Find orphaned routes (routes that aren't linked to)
  for (const route of routes) {
    if (!route.used) {
      results.orphanedRoutes.push(route);
    }
  }
  
  return results;
}

// Generate a navigation map visualization
function generateNavigationMap(routes, links) {
  const map = {};
  
  // Create nodes for each route
  routes.forEach(route => {
    map[route.path] = {
      component: route.component,
      incomingLinks: [],
      outgoingLinks: []
    };
  });
  
  // Add links between nodes
  links.forEach(link => {
    if (!link.isValid || link.to.startsWith('http') || link.to.startsWith('#')) return;
    
    // Get source component (the component containing the link)
    const sourceFile = link.file;
    let sourceComponent = path.basename(sourceFile, path.extname(sourceFile));
    
    // Find matching route for source component
    let sourceRoute = null;
    for (const route of routes) {
      if (route.file === sourceFile || route.component === sourceComponent) {
        sourceRoute = route.path;
        break;
      }
    }
    
    // Add to navigation map
    if (sourceRoute && map[sourceRoute] && map[link.to]) {
      map[sourceRoute].outgoingLinks.push(link.to);
      map[link.to].incomingLinks.push(sourceRoute);
    }
  });
  
  return map;
}

// Generate a detailed report
function generateReport(routes, links, validationResults, navigationMap) {
  const report = [];
  
  // Header
  report.push('# Navigation Integrity Report');
  report.push(`Generated on: ${new Date().toISOString()}`);
  report.push('');
  
  // Summary
  report.push('## Summary');
  report.push(`- Total routes defined: ${routes.length}`);
  report.push(`- Total navigation links: ${links.length}`);
  report.push(`- Broken links: ${validationResults.brokenLinks.length}`);
  report.push(`- Orphaned routes: ${validationResults.orphanedRoutes.length}`);
  report.push('');
  
  // Broken Links
  report.push('## Broken Links');
  if (validationResults.brokenLinks.length === 0) {
    report.push('No broken links found! 🎉');
  } else {
    report.push('The following links point to undefined routes:');
    report.push('');
    report.push('| Link Target | Source File |');
    report.push('|------------|-------------|');
    validationResults.brokenLinks.forEach(link => {
      report.push(`| \`${link.to}\` | ${link.file} |`);
    });
  }
  report.push('');
  
  // Orphaned Routes
  report.push('## Orphaned Routes');
  if (validationResults.orphanedRoutes.length === 0) {
    report.push('No orphaned routes found! All routes are accessible via links.');
  } else {
    report.push('The following routes are not linked to from anywhere in the codebase:');
    report.push('');
    report.push('| Route | Component | File |');
    report.push('|-------|-----------|------|');
    validationResults.orphanedRoutes.forEach(route => {
      report.push(`| \`${route.path}\` | ${route.component} | ${route.file} |`);
    });
  }
  report.push('');
  
  // Navigation Map
  report.push('## Navigation Flow Map');
  report.push('```');
  report.push('Navigation Flow:');
  report.push('');
  
  // Generate a visual representation of the navigation flow
  const visitedNodes = new Set();
  
  function printNodeAndChildren(nodePath, depth = 0) {
    if (visitedNodes.has(nodePath) || !navigationMap[nodePath]) return;
    visitedNodes.add(nodePath);
    
    const indentation = '  '.repeat(depth);
    report.push(`${indentation}${nodePath} (${navigationMap[nodePath].component})`);
    
    navigationMap[nodePath].outgoingLinks.forEach(childPath => {
      if (navigationMap[childPath]) {
        const childIndentation = '  '.repeat(depth + 1);
        report.push(`${childIndentation}↳ ${childPath}`);
        
        // Limit recursion depth to prevent circular references
        if (depth < 3 && !visitedNodes.has(childPath)) {
          printNodeAndChildren(childPath, depth + 2);
        }
      }
    });
  }
  
  // Find root nodes (pages with no incoming links)
  const rootNodes = Object.keys(navigationMap).filter(path => 
    navigationMap[path].incomingLinks.length === 0 || path === '/' || path.endsWith('/index')
  );
  
  // Print the navigation tree starting from each root node
  rootNodes.forEach(rootPath => {
    printNodeAndChildren(rootPath);
    report.push('');
  });
  
  report.push('```');
  
  // Recommendations
  report.push('## Recommendations');
  report.push('');
  
  if (validationResults.brokenLinks.length > 0) {
    report.push('### Fix Broken Links');
    report.push('- Update the target paths to match defined routes');
    report.push('- Or add the missing routes to your navigation configuration');
    report.push('');
  }
  
  if (validationResults.orphanedRoutes.length > 0) {
    report.push('### Address Orphaned Routes');
    report.push('- Add navigation links to make these routes accessible');
    report.push('- Or remove them if they are no longer needed');
    report.push('');
  }
  
  report.push('### Maintain Navigation Integrity');
  report.push('- Run this validation tool regularly as part of your development process');
  report.push('- Consider adding navigation testing to your test suite');
  report.push('- Document your navigation structure for better team understanding');
  
  return report;
}

// Run the validation
validateNavigation();