import { EventEmitter } from 'events';
import type { RegisterClockNodeRequest } from '@the-new-fuse/control-plane-contracts';
import { Logger } from '../utils/Logger';
import { MasterClockControlClient } from './MasterClockControlClient.js';
import {
  InMemoryMasterClockReceiverStateStore,
  type MasterClockReceiverStateStore,
} from './MasterClockReceiverStateStore.js';
import {
  MasterClockSignalReceiver,
  type MasterClockReceiveResult,
} from './MasterClockSignalReceiver.js';

export interface MasterClockPollingReceiverOptions {
  client: MasterClockControlClient;
  receiver: MasterClockSignalReceiver;
  logger: Logger;
  pollIntervalMs?: number;
  autoRegister?: boolean;
  registration?: RegisterClockNodeRequest;
  stateStore?: MasterClockReceiverStateStore;
}

export class MasterClockPollingReceiver extends EventEmitter {
  private readonly client: MasterClockControlClient;
  private readonly receiver: MasterClockSignalReceiver;
  private readonly logger: Logger;
  private readonly pollIntervalMs: number;
  private readonly autoRegister: boolean;
  private readonly registration?: RegisterClockNodeRequest;
  private readonly stateStore: MasterClockReceiverStateStore;
  private pollTimer?: NodeJS.Timeout;
  private inFlight = false;

  constructor(options: MasterClockPollingReceiverOptions) {
    super();
    this.client = options.client;
    this.receiver = options.receiver;
    this.logger = options.logger;
    this.pollIntervalMs = options.pollIntervalMs ?? 15_000;
    this.autoRegister = options.autoRegister ?? true;
    this.registration = options.registration;
    this.stateStore =
      options.stateStore ||
      new InMemoryMasterClockReceiverStateStore(this.receiver.getNodeId());
  }

  async start(): Promise<void> {
    if (this.autoRegister && this.registration) {
      const registeredNode = await this.client.registerNode(this.registration);
      this.receiver.setRegisteredNode(registeredNode);
      this.logger.info(
        `[MasterClockReceiver] Registered collective node ${registeredNode.node_id} certificate=${registeredNode.certificate.claims.certificate_id}`
      );
    }

    const state = await this.stateStore.load();
    if (state.processedSignals.length > 0) {
      this.logger.info(
        `[MasterClockReceiver] Loaded ${state.processedSignals.length} persisted processed signal markers`
      );
    }

    await this.pollOnce();
    this.pollTimer = setInterval(() => {
      void this.pollOnce();
    }, this.pollIntervalMs);
  }

  async stop(): Promise<void> {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
  }

  async pollOnce(): Promise<MasterClockReceiveResult | null> {
    if (this.inFlight) {
      return null;
    }
    this.inFlight = true;

    try {
      const signal = await this.client.getLatestSignal(this.receiver.getNodeId());
      if (!signal) {
        return null;
      }

      if (await this.stateStore.hasProcessed(signal.payload.signal_id)) {
        this.logger.info(
          `[MasterClockReceiver] Skipping already processed signal ${signal.payload.signal_id}`
        );
        return null;
      }

      const result = await this.receiver.receive(signal);
      await this.client.acknowledgeSignal(result.ack);
      await this.stateStore.markProcessed({
        signalId: result.ack.signal_id,
        pulseId: result.plaintext.pulse_id,
        acknowledgedAt: result.ack.synchronized_at,
        trustedSigningPublicKeyFingerprint: result.trustedSigningPublicKeyFingerprint,
      });
      this.emit('signal_processed', result);
      return result;
    } catch (error) {
      this.emit('signal_error', error);
      this.logger.error(
        `[MasterClockReceiver] Poll failure: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    } finally {
      this.inFlight = false;
    }
  }
}
