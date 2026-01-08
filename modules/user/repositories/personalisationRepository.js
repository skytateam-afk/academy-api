/**
 * Personalisation Repository
 * Handles database operations for user personalisations
 */

const knex = require('../../../config/knex');
const logger = require('../../../config/winston');

class PersonalisationRepository {
    /**
     * Get personalisation by user ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Personalisation data
     */
    async getByUserId(userId) {
        try {
            const result = await knex('user_personalisations')
                .where('user_id', userId)
                .first();

            return result || null;
        } catch (error) {
            logger.error('Error in PersonalisationRepository.getByUserId', { error: error.message, userId });
            throw error;
        }
    }

    /**
     * Create or update personalisation
     * @param {string} userId - User ID
     * @param {Object} data - Data to merge
     * @returns {Promise<Object>} Updated personalisation
     */
    async update(userId, data) {
        try {
            // Check if exists
            const existing = await this.getByUserId(userId);

            if (existing) {
                // Merge new data with existing data
                const newData = { ...existing.data, ...data };

                const [updated] = await knex('user_personalisations')
                    .where('user_id', userId)
                    .update({
                        data: newData,
                        updated_at: new Date()
                    })
                    .returning('*');

                return updated;
            } else {
                // Create new
                const [created] = await knex('user_personalisations')
                    .insert({
                        user_id: userId,
                        data: data
                    })
                    .returning('*');

                return created;
            }
        } catch (error) {
            logger.error('Error in PersonalisationRepository.update', { error: error.message, userId });
            throw error;
        }
    }
}

module.exports = new PersonalisationRepository();
