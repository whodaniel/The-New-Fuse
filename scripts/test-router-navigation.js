/**
 * TNF Router Navigation Test
 * Tests all routes defined in ComprehensiveRouter
 */

(async function testRouterNavigation() {
  const routes = [
    { path: '/', name: 'Home' },
    { path: '/agents', name: 'Agents' },
    { path: '/agents/create', name: 'Create Agent' },
    { path: '/agents/marketplace', name: 'NFT Marketplace' },
    { path: '/chat', name: 'Multi-Agent Chat' },
    { path: '/workspace', name: 'Workspace' },
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/dashboard/agents', name: 'Agent Dashboard' },
    { path: '/dashboard/settings', name: 'Dashboard Settings' },
    { path: '/settings', name: 'General Settings' },
    { path: '/settings/profile', name: 'User Profile' },
    { path: '/admin', name: 'Admin Settings' },
    { path: '/admin/workspace', name: 'Workspace Management' },
    { path: '/community', name: 'Community Hub' },
    { path: '/workflows', name: 'Workflow Templates' },
  ];

  console.group('🧭 Router Navigation Test');

  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  for (const route of routes) {
    console.group(`Testing: ${route.name} (${route.path})`);

    try {
      // Navigate
      window.history.pushState({}, '', route.path);
      window.dispatchEvent(new PopStateEvent('popstate'));

      // Wait for React to update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check for console errors (basic check)
      const hasContent = document.getElementById('root')?.textContent?.length > 0;

      if (hasContent) {
        console.log(`✓ ${route.name} loaded successfully`);
        results.passed.push(route.name);
      } else {
        console.warn(`⚠ ${route.name} - No content rendered`);
        results.warnings.push(route.name);
      }

    } catch (error) {
      console.error(`✗ Error testing ${route.name}:`, error);
      results.failed.push(route.name);
    }

    console.groupEnd();
  }

  console.groupEnd();

  console.group('📊 Router Test Summary');
  console.log(`✓ Passed: ${results.passed.length}/${routes.length}`);
  console.log(`⚠ Warnings: ${results.warnings.length}`);
  console.log(`✗ Failed: ${results.failed.length}`);

  if (results.failed.length === 0) {
    console.log('%c✅ All routes tested successfully', 'color: green; font-weight: bold;');
  } else {
    console.log('%c❌ Some routes failed', 'color: red; font-weight: bold;');
    console.log('Failed routes:', results.failed);
  }

  console.groupEnd();

  return results;
})();
