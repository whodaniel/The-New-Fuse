import * as bcrypt from 'bcrypt';

/**
 * Compare a plain text password with a hashed password
 * @param plainTextPassword The plain text password to compare
 * @param hashedPassword The hashed password to compare against
 * @returns Promise<boolean> True if passwords match, false otherwise
 */
export async function comparePasswords(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plainTextPassword, hashedPassword);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}

/**
 * Hash a password
 * @param password The password to hash
 * @returns Promise<string> The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}
