const fs = require('fs');
const { exec } = require('child_process');

exec('ls -la', (err, stdout, stderr) => {
  if (err) {
    fs.writeFileSync('debug_ls_error.txt', err.message);
    return;
  }
  fs.writeFileSync('debug_ls.txt', stdout);
});
