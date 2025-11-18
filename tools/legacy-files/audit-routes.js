#!/usr/bin/env node

// Comprehensive route audit for The New Fuse
// This script validates all routes and identifies issues

const fs = require('fs');
const path = require('path');

const routerPath = './apps/frontend/src/ComprehensiveRouter.tsx';
const pagesDir = './apps/frontend/src/pages';

console.log('🔍 Starting comprehensive route audit...\n');

// Read the router file
const routerContent = fs.readFileSync(routerPath, 'utf8');

// Extract all routes from the router
const routeRegex = /<Route\s+path="([^"]+)"\s+element={([^}]+)}/g;
const routes = [];
let match;

while ((match = routeRegex.exec(routerContent)) !== null) {
  routes.push({
    path: match[1],
    element: match[2].trim()
  });
}

console.log(`📊 Found ${routes.length} routes total\n`);

// Categorize routes
const routeCategories = {
  public: [],
  authenticated: [],
  admin: [],
  broken: [],
  working: []
};

// Define route categorization
const publicRoutes = ['/', '/login', '/register', '/legal/privacy', '/legal/terms'];
const adminRoutes = ['/admin'];
const brokenElements = ['<LazyPage', '<div'];

routes.forEach(route => {
  if (publicRoutes.some(pub => route.path.startsWith(pub.replace('*', '')))) {
    routeCategories.public.push(route);
  } else if (adminRoutes.some(admin => route.path.startsWith(admin))) {
    routeCategories.admin.push(route);
  } else {
    routeCategories.authenticated.push(route);
  }

  if (brokenElements.some(broken => route.element.includes(broken))) {
    routeCategories.broken.push(route);
  } else {
    routeCategories.working.push(route);
  }
});

// Report findings
console.log('📋 ROUTE AUDIT REPORT\n');
console.log('=' * 50);

console.log('\n🌐 PUBLIC ROUTES (accessible without login):');
routeCategories.public.forEach(route => {
  console.log(`  ✓ ${route.path} → ${route.element}`);
});

console.log('\n🔐 AUTHENTICATED ROUTES (require login):');
routeCategories.authenticated.slice(0, 10).forEach(route => {
  console.log(`  ✓ ${route.path} → ${route.element}`);
});
if (routeCategories.authenticated.length > 10) {
  console.log(`  ... and ${routeCategories.authenticated.length - 10} more`);
}

console.log('\n👨‍💼 ADMIN ROUTES (require admin access):');
routeCategories.admin.forEach(route => {
  console.log(`  ✓ ${route.path} → ${route.element}`);
});

console.log('\n❌ BROKEN ROUTES (using placeholder components):');
routeCategories.broken.forEach(route => {
  console.log(`  ⚠️  ${route.path} → ${route.element}`);
});

console.log('\n✅ WORKING ROUTES (using real components):');
console.log(`  ${routeCategories.working.length} routes have proper components`);

// Check for duplicate routes
console.log('\n🔍 CHECKING FOR DUPLICATE ROUTES...');
const pathCounts = {};
routes.forEach(route => {
  pathCounts[route.path] = (pathCounts[route.path] || 0) + 1;
});

const duplicates = Object.entries(pathCounts).filter(([path, count]) => count > 1);
if (duplicates.length > 0) {
  console.log('⚠️  DUPLICATE ROUTES FOUND:');
  duplicates.forEach(([path, count]) => {
    console.log(`  ${path} appears ${count} times`);
  });
} else {
  console.log('✅ No duplicate routes found');
}

// Check navigation links vs actual routes
console.log('\n🔗 NAVIGATION LINK VALIDATION...');

const navigationLinks = [
  '/dashboard',
  '/agents',
  '/agents/new',
  '/agents/unified-creator',
  '/workflows',
  '/workflows/builder',
  '/workflows/templates',
  '/workflows/executions',
  '/tasks',
  '/tasks/new',
  '/workspace/overview',
  '/workspace/analytics',
  '/workspace/members',
  '/workspace/chat',
  '/workspace/settings',
  '/analytics',
  '/admin/dashboard',
  '/admin/users',
  '/admin/workspaces',
  '/admin/system-health',
  '/admin/feature-flags',
  '/admin/settings',
  '/settings',
  '/settings/appearance',
  '/settings/notifications',
  '/settings/security',
  '/settings/api'
];

const routePaths = routes.map(r => r.path);
const missingRoutes = navigationLinks.filter(link => 
  !routePaths.some(path => path === link || (path.includes(':') && link.startsWith(path.split(':')[0])))
);

if (missingRoutes.length > 0) {
  console.log('❌ NAVIGATION LINKS WITHOUT ROUTES:');
  missingRoutes.forEach(link => {
    console.log(`  ⚠️  ${link} - linked in navigation but no route exists`);
  });
} else {
  console.log('✅ All navigation links have corresponding routes');
}

console.log('\n🎯 RECOMMENDATIONS:');
console.log('1. Fix broken routes by creating proper page components');
console.log('2. Remove duplicate route definitions');
console.log('3. Create missing routes for navigation links');
console.log('4. Implement role-based navigation display');
console.log('5. Add proper error boundaries for route failures');

console.log('\n📝 PRIORITY FIXES NEEDED:');
routeCategories.broken.slice(0, 5).forEach((route, index) => {
  console.log(`${index + 1}. Create component for ${route.path}`);
});

console.log('\n✨ Audit complete! Check the issues above and implement fixes.\n');
