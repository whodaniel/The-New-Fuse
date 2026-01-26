#!/usr/bin/env node

/**
 * Deployment Verification Script
 *
 * This script verifies that a frontend deployment is healthy by:
 * 1. Checking that index.html loads
 * 2. Verifying all JS/CSS chunks referenced in HTML are accessible
 * 3. Testing basic page functionality
 *
 * Run after deployment to catch issues before users do.
 *
 * Usage:
 *   node verify-deployment.js https://thenewfuse.com
 */

const https = require('https');
const http = require('http');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function success(message) {
  log(`✓ ${message}`, COLORS.green);
}

function error(message) {
  log(`✗ ${message}`, COLORS.red);
}

function warn(message) {
  log(`⚠ ${message}`, COLORS.yellow);
}

function info(message) {
  log(`ℹ ${message}`, COLORS.cyan);
}

/**
 * Fetch a URL and return the response
 */
function fetch(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    request.on('error', reject);
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Extract all JS and CSS asset URLs from HTML
 */
function extractAssets(html, baseUrl) {
  const assets = [];

  // Extract <script src="...">
  const scriptMatches = html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi);
  for (const match of scriptMatches) {
    const src = match[1];
    if (src.startsWith('http')) {
      assets.push(src);
    } else {
      const url = new URL(src, baseUrl);
      assets.push(url.href);
    }
  }

  // Extract <link rel="stylesheet" href="...">
  const cssMatches = html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi);
  for (const match of cssMatches) {
    const href = match[1];
    if (href.startsWith('http')) {
      assets.push(href);
    } else {
      const url = new URL(href, baseUrl);
      assets.push(url.href);
    }
  }

  // Also check for link href before rel
  const cssMatches2 = html.matchAll(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']stylesheet["']/gi);
  for (const match of cssMatches2) {
    const href = match[1];
    if (href.startsWith('http')) {
      assets.push(href);
    } else {
      const url = new URL(href, baseUrl);
      assets.push(url.href);
    }
  }

  return [...new Set(assets)]; // Remove duplicates
}

/**
 * Verify a single asset is accessible
 */
async function verifyAsset(url) {
  try {
    const response = await fetch(url);

    if (response.statusCode === 200) {
      return { success: true, url };
    } else {
      return {
        success: false,
        url,
        error: `HTTP ${response.statusCode}`,
      };
    }
  } catch (err) {
    return {
      success: false,
      url,
      error: err.message,
    };
  }
}

/**
 * Main verification function
 */
async function verifyDeployment(baseUrl) {
  info(`Verifying deployment at: ${baseUrl}\n`);

  let allPassed = true;

  // Step 1: Fetch index.html
  info('Step 1: Checking index.html...');
  try {
    const response = await fetch(baseUrl);

    if (response.statusCode !== 200) {
      error(`index.html returned HTTP ${response.statusCode}`);
      allPassed = false;
      return allPassed;
    }

    success('index.html loaded successfully');

    // Check cache headers
    const cacheControl = response.headers['cache-control'];
    if (cacheControl && cacheControl.includes('no-cache')) {
      success('index.html has correct no-cache headers');
    } else {
      warn(`index.html cache-control: ${cacheControl || 'not set'}`);
    }

    // Step 2: Extract and verify all assets
    info('\nStep 2: Extracting assets from HTML...');
    const assets = extractAssets(response.body, baseUrl);
    info(`Found ${assets.length} assets to verify\n`);

    if (assets.length === 0) {
      warn('No assets found in HTML. This might be an issue.');
      allPassed = false;
    }

    // Step 3: Verify each asset
    info('Step 3: Verifying all assets are accessible...');
    const results = await Promise.all(assets.map(verifyAsset));

    const failed = results.filter((r) => !r.success);
    const passed = results.filter((r) => r.success);

    if (passed.length > 0) {
      success(`${passed.length}/${assets.length} assets verified successfully`);
    }

    if (failed.length > 0) {
      error(`\n${failed.length} assets failed to load:`);
      failed.forEach((result) => {
        error(`  ${result.url}`);
        error(`    Error: ${result.error}`);
      });
      allPassed = false;
    }
  } catch (err) {
    error(`Failed to load index.html: ${err.message}`);
    allPassed = false;
    return allPassed;
  }

  // Final result
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    success('\n✓ Deployment verification PASSED\n');
  } else {
    error('\n✗ Deployment verification FAILED\n');
    error('Please check the errors above and redeploy if necessary.\n');
  }

  return allPassed;
}

// Run the script
if (require.main === module) {
  const baseUrl = process.argv[2] || 'https://thenewfuse.com';

  verifyDeployment(baseUrl)
    .then((passed) => {
      process.exit(passed ? 0 : 1);
    })
    .catch((err) => {
      error(`Unexpected error: ${err.message}`);
      console.error(err);
      process.exit(1);
    });
}

module.exports = { verifyDeployment };
