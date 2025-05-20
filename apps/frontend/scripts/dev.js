#!/usr/bin/env node

const detect = require('detect-port');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

const DEFAULT_PORT = 3001;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function choosePort(defaultPort) {
  let port = await detect(defaultPort);
  if (port === defaultPort) {
    return port;
  }
  return new Promise((resolve) => {
    rl.question(`Port ${defaultPort} is in use. Use ${port} instead? (Y/n): `, (answer) => {
      if (answer.toLowerCase() === 'y' || answer === '') {
        resolve(port);
      } else {
        rl.question(`Kill process on port ${defaultPort}? (Y/n): `, (killAnswer) => {
          if (killAnswer.toLowerCase() === 'y' || killAnswer === '') {
            try {
              execSync(`lsof -ti tcp:${defaultPort} | xargs kill -9`);
              console.log(`Killed process on port ${defaultPort}`);
              resolve(defaultPort);
            } catch (e) {
              console.error('Failed to kill process:', e);
              resolve(port);
            }
          } else {
            resolve(port);
          }
        });
      }
    });
  });
}

async function main() {
  rl.question('Launch frontend locally or with Docker? (local/docker): ', async (mode) => {
    if (mode.toLowerCase() === 'docker') {
      rl.close();
      spawn('docker', ['compose', '-f', '../../docker-compose.frontend.yml', 'up', '--build', '-d'], { stdio: 'inherit' });
    } else {
      const port = await choosePort(DEFAULT_PORT);
      rl.close();
      spawn('yarn', ['dev', '--port', port], { stdio: 'inherit' });
    }
  });
}

main();
