import express, { Request, Response } from 'express';
import session from 'express-session';
import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { hash, compare } from 'bcrypt'; // Changed 'generate' to 'hash'
import { Pool } from 'pg';
import { performance } from 'perf_hooks';
import { createClient } from 'ioredis'; // Changed from 'redis' to 'ioredis'

// Configuration
const SECRET_KEY = process.env.SECRET_KEY || 'dev';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/chat';
const SESSION_LIFETIME = 7 * 24 * 60 * 60 * 1000; // 7 days

// Initialize database connection
const pool = new Pool({
  connectionString: DATABASE_URL
});

// Initialize Redis client
const redisClient = createClient(); // Removed the RedisClientType type that doesn't exist in ioredis
// No need to call connect() on ioredis - it connects automatically

// Initialize Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: SESSION_LIFETIME }
}));

// Authentication routes
// Fix the register route handler with proper typing
app.post('/register', async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).send('Username or email already exists');
    }

    const passwordHash = await hash(password, 10);
    await pool.query('INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)', [username, email, passwordHash]);
    res.status(201).send('Registration successful');
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : 'Unknown error');
    res.status(500).send('Internal server error');
  }
});

app.post('/login', async (req: Request, res: Response) => {
  const { username, password, remember } = req.body;

  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userCheck.rows.length === 0) {
      return res.status(400).send('Invalid username or password');
    }

    const user = userCheck.rows[0];
    const passwordMatch = await compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(400).send('Invalid username or password');
    }

    req.session.user_id = user.id;
    if (remember) {
      req.session.cookie.maxAge = SESSION_LIFETIME;
    }
    res.status(200).send('Login successful');
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : 'Unknown error');
    res.status(500).send('Internal server error');
  }
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.status(500).send('Internal server error');
    }
    res.status(200).send('Logout successful');
  });
});

// Main routes
app.get('/', (req: Request, res: Response) => {
  res.sendFile(__dirname + '/../../HTML/index.html');
});

app.get('/dashboard', (req: Request, res: Response) => {
  if (!req.session.user_id) {
    return res.redirect('/login');
  }
  res.sendFile(__dirname + '/../../HTML/new_dashboard.html');
});

app.get('/customize', (req: Request, res: Response) => {
  if (!req.session.user_id) {
    return res.redirect('/login');
  }
  res.sendFile(__dirname + '/../../HTML/new_customize.html');
});

app.post('/agents/new', async (req: Request, res: Response) => {
  if (!req.session.user_id) {
    return res.redirect('/login');
  }

  const { name, description, agent_type, language_model, custom_prompt, custom_parameters } = req.body;

  try {
    await pool.query(
      'INSERT INTO agents (name, description, agent_type, language_model, custom_prompt, custom_parameters, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [name, description, agent_type, language_model, custom_prompt, custom_parameters, req.session.user_id]
    );
    res.status(201).send('Agent created successfully');
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : 'Unknown error');
    res.status(500).send('Internal server error');
  }
});

app.post('/pipelines/new', async (req: Request, res: Response) => {
  if (!req.session.user_id) {
    return res.redirect('/login');
  }

  const { name, description, input_type, output_type, steps } = req.body;

  try {
    await pool.query(
      'INSERT INTO pipelines (name, description, input_type, output_type, steps, user_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [name, description, input_type, output_type, steps, req.session.user_id]
    );
    res.status(201).send('Pipeline created successfully');
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : 'Unknown error');
    res.status(500).send('Internal server error');
  }
});

// WebSocket server for metrics
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', async (message: string) => {
    try {
      const metrics = await getMetrics();
      ws.send(JSON.stringify(metrics));
    } catch (error) {
      console.error(error);
      ws.close();
    }
  });

  ws.on('close', () => {
    
  });
});

// Metrics handler
async function getMetrics(): Promise<any> { // Removed extra ': any'
  const start = performance.now();
  // Simulate some performance metrics
  const metrics = {
    latency: performance.now() - start,
    requests: Math.floor(Math.random() * 100),
    errors: Math.floor(Math.random() * 5)
  };
  return metrics;
}

// Middleware to handle WebSocket upgrade
app.use((req, res, next) => {
  if (req.url === '/ws/metrics' && req.headers.upgrade === 'websocket') {
    wss.handleUpgrade(req, req.socket, Buffer.alloc(0), ws => {
      wss.emit('connection', ws, req);
    });
  } else {
    next();
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  
});
