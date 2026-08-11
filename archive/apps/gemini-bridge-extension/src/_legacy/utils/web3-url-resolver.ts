/**
 * Web3 URL Resolver
 * Converts decentralized web protocols to HTTP gateway URLs
 */

export interface Web3Config {
  ipfsGateway: string;
  arweaveGateway: string;
  swarmGateway: string;
}

export const DEFAULT_WEB3_CONFIG: Web3Config = {
  ipfsGateway: 'https://ipfs.io',
  arweaveGateway: 'https://arweave.net',
  swarmGateway: 'https://gateway.ethswarm.org',
};

export type Web3Protocol = 'ipfs' | 'ipns' | 'ens' | 'ar' | 'bzz';

/**
 * Check if a URL uses a Web3 protocol
 */
export function isWeb3Url(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol.replace(':', '');
    return ['ipfs', 'ipns', 'ens', 'ar', 'bzz'].includes(protocol);
  } catch {
    return false;
  }
}

/**
 * Get the Web3 protocol type from a URL
 */
export function getWeb3Protocol(url: string): Web3Protocol | null {
  try {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol.replace(':', '') as Web3Protocol;
    return ['ipfs', 'ipns', 'ens', 'ar', 'bzz'].includes(protocol) ? protocol : null;
  } catch {
    return null;
  }
}

/**
 * Resolve IPFS URL to HTTP gateway URL
 * Supports both ipfs:// and ipns:// protocols
 *
 * Examples:
 * - ipfs://QmHash -> https://ipfs.io/ipfs/QmHash
 * - ipfs://QmHash/path/file.html -> https://ipfs.io/ipfs/QmHash/path/file.html
 * - ipns://domain.com -> https://ipfs.io/ipns/domain.com
 */
function resolveIpfsUrl(url: string, config: Web3Config): string {
  const urlObj = new URL(url);
  const protocol = urlObj.protocol.replace(':', ''); // 'ipfs' or 'ipns'
  const hash = urlObj.hostname; // CID or domain
  const path = urlObj.pathname; // Additional path

  return `${config.ipfsGateway}/${protocol}/${hash}${path}`;
}

/**
 * Resolve ENS (Ethereum Name Service) URL to HTTP URL
 *
 * Examples:
 * - ens://vitalik.eth -> https://vitalik.eth.limo
 * - ens://example.eth/path -> https://example.eth.limo/path
 */
function resolveEnsUrl(url: string): string {
  const urlObj = new URL(url);
  const domain = urlObj.hostname; // e.g., 'vitalik.eth'
  const path = urlObj.pathname;

  // Use eth.limo gateway for ENS resolution
  return `https://${domain}.limo${path}`;
}

/**
 * Resolve Arweave URL to HTTP gateway URL
 *
 * Examples:
 * - ar://txId -> https://arweave.net/txId
 * - ar://txId/path -> https://arweave.net/txId/path
 */
function resolveArweaveUrl(url: string, config: Web3Config): string {
  const urlObj = new URL(url);
  const txId = urlObj.hostname; // Transaction ID
  const path = urlObj.pathname;

  return `${config.arweaveGateway}/${txId}${path}`;
}

/**
 * Resolve Swarm URL to HTTP gateway URL
 *
 * Examples:
 * - bzz://hash -> https://gateway.ethswarm.org/bzz/hash
 * - bzz://hash/path -> https://gateway.ethswarm.org/bzz/hash/path
 */
function resolveSwarmUrl(url: string, config: Web3Config): string {
  const urlObj = new URL(url);
  const hash = urlObj.hostname;
  const path = urlObj.pathname;

  return `${config.swarmGateway}/bzz/${hash}${path}`;
}

/**
 * Resolve any Web3 URL to its HTTP gateway equivalent
 *
 * @param url - The Web3 URL to resolve (ipfs://, ipns://, ens://, ar://, bzz://)
 * @param config - Optional Web3 gateway configuration
 * @returns HTTP URL or original URL if not a Web3 protocol
 */
export function resolveWeb3Url(url: string, config: Web3Config = DEFAULT_WEB3_CONFIG): string {
  if (!isWeb3Url(url)) {
    return url;
  }

  const protocol = getWeb3Protocol(url);

  switch (protocol) {
    case 'ipfs':
    case 'ipns':
      return resolveIpfsUrl(url, config);

    case 'ens':
      return resolveEnsUrl(url);

    case 'ar':
      return resolveArweaveUrl(url, config);

    case 'bzz':
      return resolveSwarmUrl(url, config);

    default:
      return url;
  }
}

/**
 * Get a user-friendly description of a Web3 protocol
 */
export function getProtocolDescription(protocol: Web3Protocol): string {
  const descriptions: Record<Web3Protocol, string> = {
    ipfs: 'InterPlanetary File System',
    ipns: 'IPFS Name System',
    ens: 'Ethereum Name Service',
    ar: 'Arweave Permanent Storage',
    bzz: 'Swarm Distributed Storage',
  };

  return descriptions[protocol];
}

/**
 * Validate a Web3 URL format
 */
export function validateWeb3Url(url: string): { valid: boolean; error?: string } {
  try {
    const urlObj = new URL(url);
    const protocol = getWeb3Protocol(url);

    if (!protocol) {
      return { valid: false, error: 'Not a valid Web3 protocol' };
    }

    const hostname = urlObj.hostname;

    // Basic validation based on protocol
    switch (protocol) {
      case 'ipfs':
        // IPFS CIDv0 starts with 'Qm', CIDv1 is base32
        if (!hostname || hostname.length < 10) {
          return { valid: false, error: 'Invalid IPFS CID' };
        }
        break;

      case 'ipns':
        // IPNS can be a CID or a domain
        if (!hostname || hostname.length < 3) {
          return { valid: false, error: 'Invalid IPNS identifier' };
        }
        break;

      case 'ens':
        // ENS domains should end with .eth
        if (!hostname.endsWith('.eth')) {
          return { valid: false, error: 'ENS domain must end with .eth' };
        }
        break;

      case 'ar':
        // Arweave transaction IDs are 43 characters
        if (!hostname || hostname.length !== 43) {
          return { valid: false, error: 'Invalid Arweave transaction ID' };
        }
        break;

      case 'bzz':
        // Swarm hash
        if (!hostname || hostname.length < 10) {
          return { valid: false, error: 'Invalid Swarm hash' };
        }
        break;
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Malformed URL' };
  }
}
