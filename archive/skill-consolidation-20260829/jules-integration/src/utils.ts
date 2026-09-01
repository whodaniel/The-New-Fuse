/**
 * Encodes a string into base64url format.
 * This is a URL-safe version of base64 encoding.
 * @param input The string to encode.
 * @returns The base64url encoded string.
 */
export function toBase64Url(input: string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Decodes a string from base64url format.
 * @param input The base64url encoded string.
 * @returns The decoded string.
 */
export function fromBase64Url(input: string): string {
  // Replace URL-safe characters with their base64 equivalents
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding back based on the string length
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }

  return Buffer.from(base64, 'base64').toString('utf8');
}
