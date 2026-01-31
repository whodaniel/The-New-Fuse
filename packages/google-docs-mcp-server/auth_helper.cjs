
const { spawn } = require('child_process');
const readline = require('readline');

const child = spawn('node', ['dist/server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

child.stderr.on('data', (data) => {
  const output = data.toString();
  // Filter out the verbose URL line if possible, or just print everything
  if (output.includes('Authorize this app by visiting this url:')) {
    const url = output.split('Authorize this app by visiting this url:')[1].trim();
    console.log('\n\n--------------- AUTH URL ---------------');
    console.log(url);
    console.log('----------------------------------------\n\n');
    
    rl.question('Paste the code here: ', (code) => {
        child.stdin.write(code + '\n');
        rl.close();
    });
  } else {
    process.stdout.write(output);
  }
});

child.stdout.on('data', (data) => {
  process.stdout.write(data.toString());
});
