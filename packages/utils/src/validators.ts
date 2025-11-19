import { URL } from 'url';
import { promises as dns } from 'dns';

/**
 * Check if a value is defined (not null or undefined)
 */
export function isDefined(value: any): boolean {
  return value !== null && value !== undefined;
}

/**
 * Check if a string is valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if an IP address is in a private or reserved range.
 * Handles IPv4 and basic IPv6 cases.
 */
function isPrivateIP(ip: string): boolean {
  // Handle IPv4-mapped IPv6 addresses (e.g., ::ffff:192.168.1.1)
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  // IPv4 check
  const parts = ip.split('.').map(part => parseInt(part, 10));
  if (parts.length === 4 && parts.every(p => !isNaN(p) && p >= 0 && p <= 255)) {
    if (parts[0] === 10) return true; // 10.0.0.0/8
    if (parts[0] === 172 && (parts[1] >= 16 && parts[1] <= 31)) return true; // 172.16.0.0/12
    if (parts[0] === 192 && parts[1] === 168) return true; // 192.168.0.0/16
    if (parts[0] === 127) return true; // 127.0.0.0/8 (localhost)
    if (parts[0] === 169 && parts[1] === 254) return true; // 169.254.0.0/16 (link-local)
    if (parts[0] === 100 && (parts[1] >= 64 && parts[1] <= 127)) return true; // 100.64.0.0/10 (carrier-grade NAT)
    if (parts[0] === 0) return true; // 0.0.0.0/8 (current network)
    return false;
  }

  // Basic IPv6 private ranges check
  if (ip.includes(':')) {
      const lowerIp = ip.toLowerCase();
      if (lowerIp === '::1') return true; // localhost
      if (lowerIp.startsWith('fc00:')) return true; // unique local
      if (lowerIp.startsWith('fe80:')) return true; // link-local
  }

  return false;
}


/**
 * Validates that a URL is well-formed, uses http/https, and resolves to a public IP address.
 * Returns an object with a 'valid' boolean and an optional 'reason' for failure.
 */
export async function isValidPublicUrl(url: string): Promise<{ valid: boolean; reason?: string }> {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return { valid: false, reason: 'Invalid protocol. Only http: and https: are allowed.' };
    }

    const family = 4; // Force IPv4 lookup for simplicity and consistency
    const { address } = await dns.lookup(parsedUrl.hostname, { family });

    if (isPrivateIP(address)) {
      return { valid: false, reason: `Resolved IP address '${address}' is in a private or reserved range.` };
    }

    return { valid: true };
  } catch (error) {
    if (error instanceof Error) {
        return { valid: false, reason: `URL validation failed: ${error.message}` };
    }
    return { valid: false, reason: 'An unknown error occurred during URL validation.' };
  }
}

/**
 * Check if an object has all required fields
 */
export function hasRequiredFields<T>(obj: T, fields: (keyof T)[]): boolean {
  return fields.every(field => isDefined(obj[field]));
}

/**
 * Check if a value is a valid UUID
 */
export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Check if a string is JSON parseable
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch (error) {
    return false;
  }
}
