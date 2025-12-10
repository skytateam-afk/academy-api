/**
 * OTP Service
 * Handles OTP generation, validation, and management
 */

const knex = require('../config/knex');
const crypto = require('crypto');
const logger = require('../config/winston');

// Add debugging utility to check database time
async function getDatabaseTime() {
  const result = await knex.raw('SELECT NOW() as current_time');
  return result.rows[0].current_time;
}

class OTPService {
    /**
     * Generate a random OTP code
     * @param {number} length - Length of OTP (default: 6)
     * @returns {string} OTP code
     */
    generateCode(length = 6) {
        const digits = '0123456789';
        let code = '';
        
        for (let i = 0; i < length; i++) {
            const randomIndex = crypto.randomInt(0, digits.length);
            code += digits[randomIndex];
        }
        
        return code;
    }

    /**
     * Create and send OTP to email
     * @param {string} email - User email
     * @param {string} type - OTP type ('login', 'verify', 'reset', 'mfa')
     * @param {Object} metadata - Additional metadata (ip, userAgent, mfaToken, userId)
     * @param {string} providedCode - Optional pre-generated code
     * @returns {Promise<Object>} OTP creation result
     */
    async createOTP(email, type = 'login', metadata = {}, providedCode = null) {
        try {
            // Invalidate any existing unused OTPs for this email and type
            await knex('otp_codes')
                .where({ email, type, is_used: false })
                .where('expires_at', '>', knex.fn.now())
                .update({ is_used: true, used_at: knex.fn.now() });

            // Generate OTP code (use provided code or generate new one)
            const code = providedCode || this.generateCode(6);

            // Set expiration (10 minutes from now)
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            // Prepare metadata for storage (store as JSONB in database)
            const otpMetadata = {};
            if (metadata.ip) otpMetadata.ip = metadata.ip;
            if (metadata.userAgent) otpMetadata.userAgent = metadata.userAgent;
            if (metadata.userId) otpMetadata.userId = metadata.userId;
            if (metadata.mfaToken) otpMetadata.mfaToken = metadata.mfaToken;

            // Create OTP record
            const [otp] = await knex('otp_codes')
                .insert({
                    email,
                    code,
                    type,
                    expires_at: expiresAt,
                    ip_address: metadata.ip || null,
                    user_agent: metadata.userAgent || null,
                    metadata: Object.keys(otpMetadata).length > 0 ? JSON.stringify(otpMetadata) : null
                })
                .returning('*');

            logger.info('OTP record inserted successfully', {
                otpId: otp.id,
                email,
                type,
                codeMasked: code.substring(0, 1) + '***' + code.substring(5),
                expiresAt: otp.expires_at,
                metadata: otpMetadata
            });

            logger.info('OTP created', {
                email,
                type,
                expiresAt,
                ip: metadata.ip
            });

            return {
                success: true,
                otpId: otp.id,
                code: code,
                expiresAt: otp.expires_at,
                expiresIn: 600 // 10 minutes in seconds
            };
        } catch (error) {
            logger.error('Error creating OTP', {
                email,
                type,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Debug function to check specific OTP lookup
     * @param {string} email - Email to check
     * @param {string} code - OTP code to check
     * @param {string} type - OTP type to check
     * @returns {Promise<Object>} Lookup debugging results
     */
    async debugOTPLookup(email, code, type = 'email_verification') {
        try {
            // Get database time
            const dbTime = await getDatabaseTime();
            logger.info('Debug OTP lookup', { email, codeLength: code.length, type, dbTime: dbTime.toISOString() });

            // Check table exists
            const tableExists = await knex.schema.hasTable('otp_codes');
            if (!tableExists) {
                logger.error('otp_codes table does not exist!');
                return { error: 'otp_codes table does not exist' };
            }

            // Raw count of all records
            const totalRecords = await knex('otp_codes').count('* as count').first();
            logger.info('Total records in otp_codes table', { total: totalRecords.count });

            // Records for this email
            const recordsForEmail = await knex('otp_codes')
                .where('email', email)
                .select('*')
                .orderBy('created_at', 'desc');

            logger.info('All OTP records for this email', {
                email,
                count: recordsForEmail.length,
                records: recordsForEmail.map(r => ({
                    id: r.id,
                    code: r.code,
                    type: r.type,
                    is_used: r.is_used,
                    expires_at: r.expires_at,
                    created_at: r.created_at,
                    code_matches: r.code === code,
                    type_matches: r.type === type,
                    not_used: r.is_used === false,
                    not_expired: new Date(r.expires_at) > dbTime
                }))
            });

            // Exact query reproduction
            const exactQuery = await knex('otp_codes')
                .where({
                    email,
                    code,
                    type,
                    is_used: false
                })
                .where('expires_at', '>', knex.fn.now())
                .orderBy('created_at', 'desc')
                .first();

            logger.info('Exact query result', {
                email, code, type,
                found: !!exactQuery,
                record: exactQuery ? {
                    id: exactQuery.id,
                    is_used: exactQuery.is_used,
                    expires_at: exactQuery.expires_at,
                    type: exactQuery.type
                } : null
            });

            return {
                tableExists,
                totalRecords: parseInt(totalRecords.count),
                recordsForEmail: recordsForEmail.length,
                codeMatch: recordsForEmail.find(r => r.code === code),
                typeMatch: recordsForEmail.find(r => r.type === type),
                availableRecords: recordsForEmail.filter(r =>
                    r.code === code &&
                    r.type === type &&
                    r.is_used === false &&
                    new Date(r.expires_at) > dbTime
                ).length,
                exactQueryFound: !!exactQuery
            };
        } catch (error) {
            logger.error('Error in debug OTP lookup', { error: error.message });
            return { error: error.message };
        }
    }

    /**
     * Debug function to inspect otp_codes table
     * @param {string} email - Email to check (optional)
     * @returns {Promise<Object>} Table inspection results
     */
    async inspectOTPs(email = null) {
        try {
            // Count total records
            const totalCount = await knex('otp_codes').count('* as count').first();

            // Get table schema info
            const schemaCheck = await knex.raw(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'otp_codes'
                AND table_schema = 'public'
                ORDER BY ordinal_position
            `);

            // Get recent records (last 10)
            const recentRecords = await knex('otp_codes')
                .select('*')
                .orderBy('created_at', 'desc')
                .limit(10);

            // Check if table exists and is accessible
            const tableExists = await knex.schema.hasTable('otp_codes');

            logger.info('OTP table inspection', {
                tableName: 'otp_codes',
                tableExists,
                totalRecords: totalCount.count,
                schema: schemaCheck.rows,
                recentRecordsCount: recentRecords.length,
                sampleRecords: recentRecords.slice(0, 3).map(r => ({
                    id: r.id,
                    email: r.email,
                    type: r.type,
                    is_used: r.is_used,
                    expires_at: r.expires_at,
                    created_at: r.created_at
                }))
            });

            return {
                success: true,
                tableName: 'otp_codes',
                tableExists,
                totalRecords: parseInt(totalCount.count),
                schema: schemaCheck.rows,
                recentRecords: recentRecords
            };
        } catch (error) {
            logger.error('Error inspecting OTP table', { error: error.message });
            return { success: false, error: error.message };
        }
    }

    /**
     * Verify OTP code
     * @param {string} email - User email
     * @param {string} code - OTP code
     * @param {string} type - OTP type
     * @returns {Promise<Object>} Verification result
     */
    async verifyOTP(email, code, type = 'login') {
        try {
            logger.info('Verifying OTP', { email, type, codeLength: code.length });

            // Get database time for comparison
            const dbTime = await getDatabaseTime();
            logger.info('Database time vs app time', {
                databaseTime: dbTime.toISOString(),
                applicationTime: new Date().toISOString(),
                timeDiff: dbTime.getTime() - Date.now()
            });

            // Find all OTPs for this email/type to debug
            const allOtpsForEmail = await knex('otp_codes')
                .where({ email, type })
                .select('id', 'code', 'is_used', 'expires_at', 'created_at')
                .orderBy('created_at', 'desc')
                .limit(5);

            logger.info('All OTPs for this email/type', {
                email, type,
                count: allOtpsForEmail.length,
                userCodeDetails: {
                    length: code.length,
                    chars: [...code].join(' '), // Show each character separated
                    trimmed: code.trim(),
                    trimmedLength: code.trim().length,
                    hasSpaces: code.includes(' '),
                    numericOnly: /^\d+$/.test(code)
                },
                otps: allOtpsForEmail.map(otp => ({
                    id: otp.id,
                    is_used: otp.is_used,
                    expires_at: otp.expires_at,
                    created_at: otp.created_at,
                    codeDetails: {
                        masked: otp.code.substring(0, 1) + '***' + otp.code.substring(5),
                        length: otp.code.length,
                        chars: [...otp.code].join(' '),
                        hasSpaces: otp.code.includes(' '),
                        numericOnly: /^\d+$/.test(otp.code),
                        exactlyEqual: otp.code === code,
                        trimmedEqual: otp.code === code.trim(),
                        spacesReplaced: otp.code.replace(/\s/g, '') === code.replace(/\s/g, '')
                    },
                    is_expired: new Date(otp.expires_at) < dbTime
                }))
            });

            // Find valid OTP
            const otp = await knex('otp_codes')
                .where({
                    email,
                    code,
                    type,
                    is_used: false
                })
                .where('expires_at', '>', knex.fn.now())
                .orderBy('created_at', 'desc')
                .first();

            logger.info('OTP lookup result', {
                email,
                type,
                code,
                found: !!otp,
                expiresAt: otp?.expires_at,
                currentTime: new Date().toISOString(),
                isExpired: otp ? (new Date() > new Date(otp.expires_at)) : null,
                matchesCriteria: otp ? {
                    email: otp.email === email,
                    code: otp.code === code,
                    type: otp.type === type,
                    is_used: otp.is_used === false,
                    expires_at: new Date(otp.expires_at) > dbTime
                } : null
            });

            if (!otp) {
                logger.warn('Invalid or expired OTP attempt', {
                    email,
                    type,
                    codeProvided: !!code
                });

                return {
                    success: false,
                    message: 'Invalid or expired OTP code. Please request a new one.'
                };
            }

            // Mark OTP as used
            await knex('otp_codes')
                .where('id', otp.id)
                .update({
                    is_used: true,
                    used_at: knex.fn.now()
                });

            logger.info('OTP verified successfully', {
                email,
                type,
                otpId: otp.id
            });

            return {
                success: true,
                message: 'OTP verified successfully',
                otpId: otp.id
            };
        } catch (error) {
            logger.error('Error verifying OTP', {
                email,
                type,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Check rate limit for OTP requests
     * @param {string} email - User email
     * @param {number} windowMinutes - Time window in minutes (default: 15)
     * @param {number} maxRequests - Maximum requests in window (default: 5)
     * @returns {Promise<Object>} Rate limit check result
     */
    async checkRateLimit(email, windowMinutes = 15, maxRequests = 5) {
        try {
            const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
            
            const count = await knex('otp_codes')
                .where('email', email)
                .where('created_at', '>', windowStart)
                .count('* as total')
                .first();

            const requestCount = parseInt(count.total);
            const isLimited = requestCount >= maxRequests;

            if (isLimited) {
                logger.warn('OTP rate limit exceeded', {
                    email,
                    requestCount,
                    windowMinutes,
                    maxRequests
                });
            }

            return {
                isLimited,
                requestCount,
                maxRequests,
                resetIn: windowMinutes * 60 // in seconds
            };
        } catch (error) {
            logger.error('Error checking rate limit', {
                email,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Find OTP record by MFA token (from metadata)
     * @param {string} mfaToken - MFA token to search for
     * @returns {Promise<Object|null>} OTP record or null
     */
    async findOTPByMfaToken(mfaToken) {
        try {
            // Find valid OTP with matching MFA token in metadata
            const otp = await knex('otp_codes')
                .where('type', 'mfa')
                .where('is_used', false)
                .where('expires_at', '>', knex.fn.now())
                .whereRaw("metadata->>'mfaToken' = ?", [mfaToken])
                .orderBy('created_at', 'desc')
                .first();

            if (otp) {
                logger.info('MFA token found for OTP verification', {
                    otpId: otp.id,
                    email: otp.email,
                    mfaToken
                });
            } else {
                logger.warn('MFA token not found or expired', { mfaToken });
            }

            return otp;
        } catch (error) {
            logger.error('Error finding OTP by MFA token', {
                mfaToken,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Clean up expired OTPs
     * @returns {Promise<number>} Number of deleted records
     */
    async cleanupExpired() {
        try {
            const deleted = await knex('otp_codes')
                .where('expires_at', '<', knex.fn.now())
                .orWhere(function() {
                    this.where('is_used', true)
                        .where('used_at', '<', knex.raw("NOW() - INTERVAL '1 day'"));
                })
                .delete();

            if (deleted > 0) {
                logger.info('Expired OTPs cleaned up', { count: deleted });
            }

            return deleted;
        } catch (error) {
            logger.error('Error cleaning up expired OTPs', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Get OTP statistics for a user
     * @param {string} email - User email
     * @returns {Promise<Object>} OTP statistics
     */
    async getStats(email) {
        try {
            const [stats] = await knex('otp_codes')
                .where('email', email)
                .select(
                    knex.raw('COUNT(*) as total_requests'),
                    knex.raw('COUNT(CASE WHEN is_used = true THEN 1 END) as successful_verifications'),
                    knex.raw('MAX(created_at) as last_request'),
                    knex.raw('MAX(used_at) as last_verification')
                );

            return stats;
        } catch (error) {
            logger.error('Error getting OTP stats', {
                email,
                error: error.message
            });
            throw error;
        }
    }
}

module.exports = new OTPService();
