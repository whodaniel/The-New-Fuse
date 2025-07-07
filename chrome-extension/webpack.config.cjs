--- a/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/chrome-extension/webpack.config.cjs
+++ b/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/chrome-extension/webpack.config.cjs
@@ -1,6 +1,7 @@
 const path = require('path');
 
 module.exports = {
+  context: path.resolve(__dirname), // Ensure Webpack resolves paths relative to this config file's directory
   // ... rest of your webpack configuration
   entry: {
     popup: './src/popup/popup-fallback.js',
