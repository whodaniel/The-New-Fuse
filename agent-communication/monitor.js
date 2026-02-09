const fs = require('fs');
const path = require('path');

const COMMUNICATION_DIR = __dirname;
const CHECK_INTERVAL = 5000; // 5 seconds

function checkForMessages() {
  const files = fs.readdirSync(COMMUNICATION_DIR);
  files.forEach(file => {
    if (file.endsWith('.json') && !file.includes('shared_memory')) {
      const filePath = path.join(COMMUNICATION_DIR, file);
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      console.log(`\n=== New message detected in ${file} ===`);
      console.log(content);
      console.log('=======================================\n');
    }
  });
}

console.log('Starting communication monitor...');
console.log(`Monitoring directory: ${COMMUNICATION_DIR}`);
setInterval(checkForMessages, CHECK_INTERVAL);
checkForMessages();
