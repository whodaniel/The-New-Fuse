import type { MasterClockSignalPlaintext } from '@the-new-fuse/control-plane-contracts';
import type { HeartbeatMonitoringService } from './HeartbeatMonitoringService.js';
import type { StallDetector } from './stall-detector.js';
import type {
  MasterClockDispatchResult,
  MasterClockDispatchTarget,
} from './MasterClockSignalReceiver.js';
import { Logger } from '../utils/Logger.js';

export interface RelayRuntimeSubDirectorOptions {
  agentId: string;
  logger: Logger;
  heartbeatMonitoringService?: Pick<
    HeartbeatMonitoringService,
    'registerAgent' | 'recordHeartbeat' | 'recordActivity'
  >;
  stallDetector?: Pick<StallDetector, 'recordActivity'>;
  continuityChannels?: string[];
}

export class RelayRuntimeSubDirector implements MasterClockDispatchTarget {
  private readonly agentId: string;
  private readonly logger: Logger;
  private readonly heartbeatMonitoringService?: Pick<
    HeartbeatMonitoringService,
    'registerAgent' | 'recordHeartbeat' | 'recordActivity'
  >;
  private readonly stallDetector?: Pick<StallDetector, 'recordActivity'>;
  private readonly continuityChannels: string[];

  constructor(options: RelayRuntimeSubDirectorOptions) {
    this.agentId = options.agentId;
    this.logger = options.logger;
    this.heartbeatMonitoringService = options.heartbeatMonitoringService;
    this.stallDetector = options.stallDetector;
    this.continuityChannels = options.continuityChannels || [];

    this.heartbeatMonitoringService?.registerAgent(this.agentId);
  }

  async dispatch(signal: MasterClockSignalPlaintext): Promise<MasterClockDispatchResult> {
    this.heartbeatMonitoringService?.recordHeartbeat(this.agentId, signal.pulse_id);
    this.heartbeatMonitoringService?.recordActivity(this.agentId, 'master_clock_signal', {
      signalId: signal.signal_id,
      pulseId: signal.pulse_id,
      masterClockId: signal.master_clock_id,
      stallDefenseRequired: signal.stall_defense.required,
    });

    if (signal.stall_defense.required) {
      for (const channelId of this.continuityChannels) {
        this.stallDetector?.recordActivity(channelId, this.agentId, false);
      }
    }

    const subDirectorStatus = signal.stall_defense.required
      ? 'stall_defense_engaged'
      : 'received';

    this.logger.info(
      [
        `[MasterClockReceiver] Verified signal ${signal.signal_id}`,
        `pulse=${signal.pulse_id}`,
        `subDirectorStatus=${subDirectorStatus}`,
        `channels=${this.continuityChannels.length}`,
      ].join(' ')
    );

    return {
      subDirectorStatus,
      metadata: {
        continuity_channel_count: this.continuityChannels.length,
        receiver_agent_id: this.agentId,
        certificate_id: signal.collective_sync.certificate_id,
        attested: signal.collective_sync.attested,
      },
    };
  }
}
