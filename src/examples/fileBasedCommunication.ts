import fs from 'fs';
import path from 'path';

const COMM_DIR = path.resolve(__dirname, '../../comm');
if (!fs.existsSync(COMM_DIR)) fs.mkdirSync(COMM_DIR, { recursive: true });

export interface SimpleMessage {
  id: string;
  source: string;
  target: string;
  content: any;
  timestamp: string;
}

export function sendMessage(source: string, target: string, content: any): void {
  const id = `${Date.now()}_${source}`;
  const msg: SimpleMessage = { id, source, target, content, timestamp: new Date().toISOString() };
  const filePath = path.join(COMM_DIR, `${id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(msg, null, 2));
  console.log(`Message written: ${filePath}`);
}

export function watchMessages(myId: string, callback: (msg: SimpleMessage) => void): void {
  fs.watch(COMM_DIR, (event, filename) => {
    if (event === 'rename' && filename.endsWith('.json')) {
      const filePath = path.join(COMM_DIR, filename);
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const msg: SimpleMessage = JSON.parse(raw);
        if (msg.target === myId) {
          callback(msg);
        }
      } catch {
        // ignore incomplete reads
      }
    }
  });
  console.log(`Watching for messages to '${myId}' in ${COMM_DIR}`);
}

// Example usage if run directly
if (require.main === module) {
  const agentId = process.argv[2] || 'agentA';
  const targetId = process.argv[3] || 'agentB';
  watchMessages(agentId, msg => console.log('Received message:', msg));
  console.log(`Sending a test ping from ${agentId} to ${targetId}`);
  sendMessage(agentId, targetId, { text: 'Hello from ' + agentId });
}