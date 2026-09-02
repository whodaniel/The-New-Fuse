const assert = require('node:assert');
const { main } = require('./post-checkout-observability.cjs');

// Minimal test to ensure module loads and main is a function.
// Testing the full integration requires a mock git environment.
assert.strictEqual(typeof main, 'function');
console.log('post-checkout-observability structure verified.');
