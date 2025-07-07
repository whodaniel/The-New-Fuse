const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const chokidar = require('chokidar');

const logStream = fs.createWriteStream(path.join(__dirname, 'message-bridge.log'), { flags: 'a' });

const log = (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    logStream.write(`${logMessage}\n`);
    process.stdout.write(`${logMessage}\n`);
};

console.log = log;
console.error = log;

const colors = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
};

console.log(`${colors.cyan}Starting Message Bridge...${colors.reset}`);

const a_inbox = path.join(__dirname, 'cli-relay-queue', 'instance_A', 'inbox');
const b_inbox = path.join(__dirname, 'cli-relay-queue', 'instance_B', 'inbox');

const rootDir = __dirname;

function watchInbox(inboxDir, targetAgent) {
    const watcher = chokidar.watch(inboxDir, { persistent: true });

    watcher.on('add', async (filePath) => {
        try {
            const messageContent = await fsp.readFile(filePath, 'utf8');
            const message = JSON.parse(messageContent);

            const newFileName = path.join(rootDir, `${message.source}_to_${targetAgent}_${Date.now()}.json`);
            await fsp.writeFile(newFileName, JSON.stringify(message, null, 2));

            console.log(`${colors.green}Bridged message from ${inboxDir} to ${newFileName}${colors.reset}`);
            await fsp.unlink(filePath);
        } catch (error) {
            console.error(`Error bridging message: ${error}`);
        }
    });
}

function watchAgentOutput(sourceAgent, targetInbox) {
    const watcher = chokidar.watch(path.join(rootDir, `*_${sourceAgent}_*.json`), { persistent: true });

    watcher.on('add', async (filePath) => {
        try {
            const messageContent = await fsp.readFile(filePath, 'utf8');
            const message = JSON.parse(messageContent);

            const newFileName = path.join(targetInbox, `${message.source_agent}_${Date.now()}.json`);
            await fsp.writeFile(newFileName, JSON.stringify(message, null, 2));

            console.log(`${colors.yellow}Bridged message from ${filePath} to ${newFileName}${colors.reset}`);
            await fsp.unlink(filePath);
        } catch (error) {
            console.error(`Error bridging message: ${error}`);
        }
    });
}

watchInbox(a_inbox, 'copilot');
watchInbox(b_inbox, 'augment');

watchAgentOutput('copilot', a_inbox);
watchAgentOutput('augment', b_inbox);

console.log(`${colors.cyan}Message Bridge is running.${colors.reset}`);