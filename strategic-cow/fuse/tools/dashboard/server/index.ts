import { spawn } from 'child_process';
import cors from 'cors';
import express from 'express';
import fs from 'fs-extra';
import glob from 'glob';
import { createServer } from 'http';
import path, { dirname } from 'path';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../..');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// --- Discovery Logic ---

interface Command {
  id: string;
  name: string;
  command: string;
  cwd: string;
  category: string;
  source: string; // 'package.json' | 'script'
  description?: string;
}

interface Project {
  name: string;
  path: string;
  type: 'app' | 'package' | 'root';
}

async function discoverProjects(): Promise<Project[]> {
  const projects: Project[] = [];

  // Root
  projects.push({ name: 'root', path: ROOT_DIR, type: 'root' });

  // Apps
  const appPaths = await glob.glob('apps/*/', { cwd: ROOT_DIR }); // Removed 'absolute: true' so paths are relative, but easier to join later?
  // standard glob returns relative paths by default usually, let's verify.
  // actually let's use full paths for safety

  for (const p of appPaths) {
    if (await fs.pathExists(path.join(ROOT_DIR, p, 'package.json'))) {
      projects.push({
        name: path.basename(p),
        path: path.join(ROOT_DIR, p),
        type: 'app',
      });
    }
  }

  // Packages
  const pkgPaths = await glob.glob('packages/*/', { cwd: ROOT_DIR });
  for (const p of pkgPaths) {
    if (await fs.pathExists(path.join(ROOT_DIR, p, 'package.json'))) {
      projects.push({
        name: path.basename(p),
        path: path.join(ROOT_DIR, p),
        type: 'package',
      });
    }
  }

  return projects;
}

async function discoverCommands(): Promise<Command[]> {
  const commands: Command[] = [];
  const projects = await discoverProjects();

  // 1. Package.json scripts
  for (const project of projects) {
    try {
      const pkg = await fs.readJson(path.join(project.path, 'package.json'));
      if (pkg.scripts) {
        for (const [name, cmd] of Object.entries(pkg.scripts)) {
          // Categorize
          let category = 'other';
          if (name.includes('build')) category = 'build';
          else if (name.includes('test')) category = 'test';
          else if (name.includes('dev') || name.includes('start')) category = 'dev';
          else if (name.includes('lint') || name.includes('format')) category = 'quality';
          else if (name.includes('deploy')) category = 'deploy';

          commands.push({
            id: `${project.type}:${project.name}:${name}`,
            name: name,
            command: cmd as string,
            cwd: project.path,
            category,
            source: `package (${project.name})`,
            description: cmd as string,
          });
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // 2. Standalone scripts
  const scriptFiles = await glob.glob('scripts/**/*.{sh,js,ts,cjs,mjs}', { cwd: ROOT_DIR });
  for (const script of scriptFiles) {
    const name = path.basename(script);
    const fullPath = path.join(ROOT_DIR, script);

    // Quick check for description/shebang
    let desc = '';
    try {
      const content = await fs.readFile(fullPath, 'utf8');
      const firstLine = content.split('\n')[0];
      if (firstLine.startsWith('#!') || firstLine.startsWith('//')) {
        // Maybe explicitly documented? For now just use filename
      }
    } catch (e) {}

    commands.push({
      id: `script:${name}`,
      name: name,
      command: script.endsWith('.sh') ? `bash ${script}` : `tsx ${script}`, // naive execution
      cwd: ROOT_DIR,
      category: 'utility',
      source: 'scripts/',
      description: fullPath,
    });
  }

  return commands;
}

// --- Routes ---

app.get('/api/commands', async (req, res) => {
  const commands = await discoverCommands();
  res.json(commands);
});

// Serve frontend
app.use(express.static(path.join(__dirname, '../dist')));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    // let next handle simple 404 for api
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// --- Execution Manager ---

const runningProcesses = new Map<string, any>();

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('execute', ({ id, command, cwd }) => {
    console.log(`Executing ${id}: ${command} in ${cwd}`);

    // Kill existing if running (simple toggle behavior)
    if (runningProcesses.has(id)) {
      const proc = runningProcesses.get(id);
      proc.kill();
      runningProcesses.delete(id);
      socket.emit('status', { id, status: 'stopped' });
      return; // Toggle off
    }

    const parts = command.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);

    // Use spawn through a shell for better compatibility
    const proc = spawn(command, {
      cwd,
      shell: true,
      env: { ...process.env, FORCE_COLOR: 'true' },
    });

    runningProcesses.set(id, proc);
    socket.emit('status', { id, status: 'running' });

    proc.stdout.on('data', (data) => {
      socket.emit('output', { id, data: data.toString() });
    });

    proc.stderr.on('data', (data) => {
      socket.emit('output', { id, data: data.toString() });
    });

    proc.on('close', (code) => {
      socket.emit('status', { id, status: 'stopped', exitCode: code });
      socket.emit('output', { id, data: `\nProcess exited with code ${code}` });
      runningProcesses.delete(id);
    });
  });

  socket.on('stop', ({ id }) => {
    if (runningProcesses.has(id)) {
      runningProcesses.get(id).kill();
      runningProcesses.delete(id);
      socket.emit('status', { id, status: 'stopped' });
    }
  });
});

const PORT = 3333;
httpServer.listen(PORT, () => {
  console.log(`TNF Dashboard Server running at http://localhost:${PORT}`);
});
