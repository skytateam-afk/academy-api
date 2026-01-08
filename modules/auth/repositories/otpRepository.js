/**
 * OTP Repository
 * Handles all database operations for OTP codes using Knex
 */

const knex = require('../../../config/knex');

class OtpRepository {
  /**
   * Create new OTP code
   */
  async create(otpData) {
    const { email, otp_code, expires_at, ip_address } = otpData;
    
    const [otp] = await knex('otp_codes')
      .insert({
        email,
        otp_code,
        expires_at,
        ip_address,
        created_at: new Date()
      })
      .returning('*');
    
    return otp;
  }

  /**
   * Find OTP by email and code
   */
  async findByEmailAndCode(email, otp_code) {
    return await knex('otp_codes')
      .where({ email, otp_code, is_used: false })
      .orderBy('created_at', 'desc')
      .first();
  }

  /**
   * Mark OTP as used
   */
  async markAsUsed(id) {
    await knex('otp_codes')
      .where({ id })
      .update({
        is_used: true,
        used_at: new Date()
      });
  }

  /**
   * Invalidate all unused OTPs for an email
   */
  async invalidateByEmail(email) {
    await knex('otp_codes')
      .where({ email, is_used: false })
      .update({
        is_used: true
      });
  }

  /**
   * Increment attempt count
   */
  async incrementAttempts(email, otp_code) {
    await knex('otp_codes')
      .where({ email, otp_code, is_used: false })
      .increment('attempts', 1);
  }

  /**
   * Delete expired OTPs (cleanup)
   */
  async deleteExpired() {
    await knex('otp_codes')
      .where('expires_at', '<', new Date())
      .delete();
  }
}

module.exports = new OtpRepository();
