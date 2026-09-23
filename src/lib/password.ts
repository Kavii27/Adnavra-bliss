import bcrypt from "bcryptjs";

const COST_FACTOR = 12;

/**
 * Hash a plaintext password with bcrypt (cost 12).
 * Never hash inline elsewhere. Always use this helper.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, COST_FACTOR);
}

/**
 * Verify a plaintext password against a bcrypt hash.
 */
export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

export { COST_FACTOR };
