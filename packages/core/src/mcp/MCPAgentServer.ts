import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger.js';
import { MCPMessage, MCPCapability, ProtocolVersion } from './types.js';
import { validateVersion, compareVersions } from '../utils/version.js';

interface ProtocolNegotiation {
  requestedVersion: string;
  supportedVersions: string[];
  selectedVersion: string | null;
  features: Set<string>;
}

@Injectable()
export class MCPAgentServer {
  private logger = new Logger(MCPAgentServer.name);
  private protocolNegotiations = new Map<string, ProtocolNegotiation>();
  private supportedVersions = ['2.0.0', '1.0.0'];
  private defaultVersion = '2.0.0';

  // ...existing code...

  async negotiateProtocol(agentId: string, requestedVersion: string): Promise<string> {
    try {
      // Validate requested version
      if (!validateVersion(requestedVersion)) {
        throw new Error(`Invalid protocol version: ${requestedVersion}`);
      }

      // Find highest compatible version
      const compatibleVersion = this.findCompatibleVersion(requestedVersion);
      if (!compatibleVersion) {
        throw new Error(`No compatible protocol version found for ${requestedVersion}`);
      }

      // Store negotiation state
      this.protocolNegotiations.set(agentId, {
        requestedVersion,
        supportedVersions: this.supportedVersions,
        selectedVersion: compatibleVersion,
        features: this.getVersionFeatures(compatibleVersion)
      });

      this.logger.log(`Negotiated protocol version ${compatibleVersion} with agent ${agentId}`);
      return compatibleVersion;
    } catch (error) {
      this.logger.error(`Protocol negotiation failed with agent ${agentId}:`, error);
      throw error;
    }
  }

  private findCompatibleVersion(requestedVersion: string): string | null {
    // Sort versions in descending order
    const sortedVersions = [...this.supportedVersions].sort(compareVersions).reverse();

    // Find highest compatible version
    return sortedVersions.find(version => 
      compareVersions(version, requestedVersion) <= 0
    ) || null;
  }

  private getVersionFeatures(version: string): Set<string> {
    const features = new Set<string>();
    
    if (compareVersions(version, '2.0.0') >= 0) {
      features.add('header-body-structure');
      features.add('streaming');
      features.add('encryption');
      features.add('capability-discovery');
    }
    
    if (compareVersions(version, '1.0.0') >= 0) {
      features.add('basic-messaging');
      features.add('capability-registration');
    }
    
    return features;
  }

  // ...rest of existing code...
}