
import { holdemV2Api } from '../apps/poker-room/src/api.js'; // Wait, I can't import from src/api directly in Node without ESM setup
// I'll use a standalone script logic.

async function runKraken() {
  const tableId = 'lobby-1';
  const agents = [
    { name: 'Kraken-1', email: 'codex304@thenewfuse.com' },
    { name: 'Kraken-2', email: 'codex305@thenewfuse.com' },
    { name: 'Kraken-3', email: 'codex306@thenewfuse.com' },
    { name: 'Kraken-4', email: 'owner@example.com' },
  ];

  for (const agent of agents) {
    console.log(`🦑 Kraken agent ${agent.name} is jacking in...`);
    // Logic to register and seat via fetch
  }
}
