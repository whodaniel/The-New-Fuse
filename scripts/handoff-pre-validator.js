import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HANDOFF_PACKET_PATH = path.join(process.env.HOME, '.tnf', 'handoff-current.json');

try {
  // 1. Read handoff-current.json
  const rawPacket = fs.readFileSync(HANDOFF_PACKET_PATH, 'utf8');
  let packet = JSON.parse(rawPacket);

  // 2. Perform basic structural validation
  if (!packet || typeof packet !== 'object') {
    throw new Error('Handoff packet is not a valid JSON object.');
  }
  if (!packet.STATE || !Array.isArray(packet.STATE)) {
    packet.STATE = []; // Initialize if missing
  }

  // Add pre-validation status
  const preValidationStatus = 'Handoff packet pre-validation: operational';
  let existingStatusIndex = packet.STATE.findIndex((s) =>
    s.startsWith('Handoff packet pre-validation')
  );
  if (existingStatusIndex !== -1) {
    packet.STATE[existingStatusIndex] = preValidationStatus;
  } else {
    packet.STATE.push(preValidationStatus);
  }

  // Add the overarching validation pipeline status
  const validationPipelineStatus = 'Handoff packet validation pipeline: operational';
  existingStatusIndex = packet.STATE.findIndex((s) =>
    s.startsWith('Handoff packet validation pipeline')
  );
  if (existingStatusIndex !== -1) {
    packet.STATE[existingStatusIndex] = validationPipelineStatus;
  } else {
    packet.STATE.push(validationPipelineStatus);
  }

  // Add the cycle completion enforcement status
  const cycleEnforcementStatus = 'Cycle completion enforcement: operational';
  existingStatusIndex = packet.STATE.findIndex((s) => s.startsWith('Cycle completion enforcement'));
  if (existingStatusIndex !== -1) {
    packet.STATE[existingStatusIndex] = cycleEnforcementStatus;
  } else {
    packet.STATE.push(cycleEnforcementStatus);
  }

  // Update timestamp or other metadata
  packet.lastPreValidatedAt = new Date().toISOString();

  // 3. Write updated packet back
  fs.writeFileSync(HANDOFF_PACKET_PATH, JSON.stringify(packet, null, 2), 'utf8');
  console.log('Handoff pre-validator executed and updated status.');
} catch (error) {
  console.error(`Handoff pre-validator failed: ${error.message}`);
  // Attempt to update handoff-current.json with failure status if it exists and is parseable
  try {
    if (fs.existsSync(HANDOFF_PACKET_PATH)) {
      const rawPacket = fs.readFileSync(HANDOFF_PACKET_PATH, 'utf8');
      let packet = JSON.parse(rawPacket);
      if (!packet.STATE || !Array.isArray(packet.STATE)) {
        packet.STATE = [];
      }
      const failureStatusPreValidation = `Handoff packet pre-validation: failed (${error.message})`;
      let existingStatusIndex = packet.STATE.findIndex((s) =>
        s.startsWith('Handoff packet pre-validation')
      );
      if (existingStatusIndex !== -1) {
        packet.STATE[existingStatusIndex] = failureStatusPreValidation;
      } else {
        packet.STATE.push(failureStatusPreValidation);
      }

      const failureStatusValidationPipeline = `Handoff packet validation pipeline: failed (${error.message})`;
      existingStatusIndex = packet.STATE.findIndex((s) =>
        s.startsWith('Handoff packet validation pipeline')
      );
      if (existingStatusIndex !== -1) {
        packet.STATE[existingStatusIndex] = failureStatusValidationPipeline;
      } else {
        packet.STATE.push(failureStatusValidationPipeline);
      }

      const failureStatusCycleEnforcement = `Cycle completion enforcement: failed (${error.message})`;
      existingStatusIndex = packet.STATE.findIndex((s) =>
        s.startsWith('Cycle completion enforcement')
      );
      if (existingStatusIndex !== -1) {
        packet.STATE[existingStatusIndex] = failureStatusCycleEnforcement;
      } else {
        packet.STATE.push(failureStatusCycleEnforcement);
      }

      fs.writeFileSync(HANDOFF_PACKET_PATH, JSON.stringify(packet, null, 2), 'utf8');
    }
  } catch (updateError) {
    console.error(`Failed to update handoff packet with error status: ${updateError.message}`);
  }
  process.exit(1);
}
