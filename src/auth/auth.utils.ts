// Refactored: Use centralized cryptoUtils for all cryptographic operations
import { getRandomBytes, timingSafeEqual } from '../utils/cryptoUtils';

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export const validatePassword = (password: string): ValidationResult => {
  if (!password || password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long" };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one uppercase letter" };
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one lowercase letter" };
  }
  
  if (!/\d/.test(password)) {
    return { isValid: false, message: "Password must contain at least one number" };
  }
  
  if (!/[!@#$%^&*]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one special character (!@#$%^&*)" };
  }
  
  return { isValid: true };
};

export const generateBackupCodes = (count: number = 10, codeLength: number = 8): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = getRandomBytes(4)
      .toString("hex")
      .toUpperCase()
      .slice(0, codeLength);
    codes.push(code);
  }
  return codes;
};

export const generateToken = (length: number = 32): string => {
  return getRandomBytes(length).toString("hex");
};

export const compareTokens = (token1: string, token2: string): boolean => {
  return timingSafeEqual(token1, token2);
};