const knex = require('../../../config/knex');
const logger = require('../../../config/winston');

class PolicyService {
    /**
     * Record policy acceptance
     * @param {string} userId - User ID
     * @param {string} policyVersion - Policy version string
     * @param {string} ipAddress - IP Address
     * @param {string} userAgent - User Agent string
     * @returns {Promise<Object>} Created record
     */
    async acceptPolicy(userId, policyVersion, ipAddress, userAgent) {
        try {
            const [record] = await knex('policy_acceptances').insert({
                user_id: userId,
                policy_version: policyVersion,
                ip_address: ipAddress,
                user_agent: userAgent
            }).returning('*');

            logger.info('Policy accepted', { userId, policyVersion });
            return record;
        } catch (error) {
            logger.error('Failed to record policy acceptance', { userId, error: error.message });
            throw error;
        }
    }
}

module.exports = new PolicyService();
