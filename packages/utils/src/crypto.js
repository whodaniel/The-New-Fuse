// Crypto utilities
import { getRandomBytes, sha256 } from '../../../src/utils/cryptoUtils';

/**
 * Generate a random hash
 * @param {number} length - Length of the hash
 * @returns {string} Random hash
 */
  return getRandomBytes(length).toString("hex");
}

/**
 * Hash a string using SHA256
 * @param {string} data - Data to hash
 * @returns {string} SHA256 hash
 */
  return sha256(data);
}

/**
 * Generate a secure random string
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
  // If base64url is needed, encode manually
  return getRandomBytes(length).toString("base64url");
}
