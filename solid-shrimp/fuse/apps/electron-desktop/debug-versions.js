console.log('Versions:', process.versions);
console.log('ExecPath:', process.execPath);
try {
  const electron = require('electron');
  console.log('require("electron") type:', typeof electron);
} catch (e) {
  console.log('require("electron") failed:', e.message);
}
