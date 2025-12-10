/**
 * Encryption Utilities
 * Handles encryption/decryption of sensitive payment data
 */

const crypto = require('crypto');

// Use a secure encryption key from environment
// In production, this should be a strong, randomly generated key
const ENCRYPTION_KEY = process.env.PAYMENT_ENCRYPTION_KEY || 'fallback-key-change-in-production';
const ALGORITHM = 'aes-256-cbc'; // Using CBC instead of GCM for Node.js compatibility

// Convert key to 32 bytes for AES-256
const getKey = () => {
  return crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
};

class PaymentEncryption {
  /**
   * Encrypt sensitive data
   * @param {string} text - Plain text to encrypt
   * @returns {string} Base64 encoded encrypted data
   */
  static encrypt(text) {
    try {
      if (!text || text.trim() === '') {
        return ''; // Return empty string for empty input
      }

      const key = getKey();
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Combine IV and encrypted data
      const combined = iv.toString('hex') + encrypted;

      return combined;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   * @param {string} encryptedText - Hex encoded encrypted data
   * @returns {string} Decrypted plain text
   */
  static decrypt(encryptedText) {
    try {
      if (!encryptedText || encryptedText.trim() === '') {
        return ''; // Return empty string for empty input
      }

      const key = getKey();

      // Extract IV (first 32 hex chars = 16 bytes)
      const ivHex = encryptedText.substring(0, 32);
      const iv = Buffer.from(ivHex, 'hex');
      const encrypted = encryptedText.substring(32);

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash sensitive data for verification (one-way)
   * @param {string} text - Text to hash
   * @returns {string} Hashed value
   */
  static hash(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * Generate a secure random key for encryption
   * @returns {string} Base64 encoded key
   */
  static generateKey() {
    return crypto.randomBytes(32).toString('base64');
  }
}

module.exports = PaymentEncryption;
