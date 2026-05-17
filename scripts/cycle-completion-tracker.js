import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HANDOFF_PACKET_PATH = path.join(process.env.HOME, '.tnf', 'handoff-current.json');

try {
  const rawPacket = fs.readFileSync(HANDOFF_PACKET_PATH, 'utf8');
  let packet = JSON.parse(rawPacket);

  if (!packet.STATE || !Array.isArray(packet.STATE)) {
    packet.STATE = [];
  }

  const status = 'Cycle completion tracking: operational';
  const existingStatusIndex = packet.STATE.findIndex((s) =>
    s.startsWith('Cycle completion tracking')
  );
  if (existingStatusIndex !== -1) {
    packet.STATE[existingStatusIndex] = status;
  } else {
    packet.STATE.push(status);
  }

  packet.lastCycleCompletionCheck = new Date().toISOString();
  fs.writeFileSync(HANDOFF_PACKET_PATH, JSON.stringify(packet, null, 2), 'utf8');
  console.log('Cycle completion tracker executed and updated status.');
} catch (error) {
  console.error(`Cycle completion tracker failed: ${error.message}`);
  try {
    if (fs.existsSync(HANDOFF_PACKET_PATH)) {
      const rawPacket = fs.readFileSync(HANDOFF_PACKET_PATH, 'utf8');
      let packet = JSON.parse(rawPacket);
      if (!packet.STATE || !Array.isArray(packet.STATE)) {
        packet.STATE = [];
      }
      const failureStatus = `Cycle completion tracking: failed (${error.message})`;
      const existingStatusIndex = packet.STATE.findIndex((s) =>
        s.startsWith('Cycle completion tracking')
      );
      if (existingStatusIndex !== -1) {
        packet.STATE[existingStatusIndex] = failureStatus;
      } else {
        packet.STATE.push(failureStatus);
      }
      fs.writeFileSync(HANDOFF_PACKET_PATH, JSON.stringify(packet, null, 2), 'utf8');
    }
  } catch (updateError) {
    console.error(`Failed to update handoff packet with error status: ${updateError.message}`);
  }
  process.exit(1);
}
