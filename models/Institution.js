/**
 * Institution Model
 * Handles institution-related database operations
 */

const knex = require('../config/knex');
const logger = require('../config/winston');

class Institution {
    /**
     * Create a new institution
     * @param {Object} institutionData - Institution data { name, official_email, address, phone_number, subscription_tier_id }
     * @returns {Promise<Object>} Created institution
     */
    static async create(institutionData) {
        try {
            const {
                name,
                official_email,
                address,
                phone_number,
                subscription_tier_id
            } = institutionData;

            if (!name) {
                throw new Error('Institution name is required');
            }

            const [institution] = await knex('institutions')
                .insert({
                    name,
                    official_email: official_email || null,
                    address: address || null,
                    phone_number: phone_number || null,
                    subscription_tier_id: subscription_tier_id || null
                })
                .returning('*');

            logger.info('Institution created successfully', { institutionId: institution.id, name });
            return institution;
        } catch (error) {
            logger.error('Error creating institution', { error: error.message });
            throw error;
        }
    }

    /**
     * Get all institutions with pagination
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Institutions with pagination
     */
    static async getAll(options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                search,
                sortBy = 'created_at',
                sortOrder = 'DESC'
            } = options;

            const offset = (page - 1) * limit;

            let query = knex('institutions')
                .leftJoin('subscription_tiers as st', 'institutions.subscription_tier_id', 'st.id')
                .select(
                    'institutions.id',
                    'institutions.name',
                    'institutions.official_email',
                    'institutions.address',
                    'institutions.phone_number',
                    'institutions.subscription_tier_id',
                    'st.name as subscription_tier_name',
                    'st.slug as subscription_tier_slug',
                    'institutions.created_at',
                    'institutions.updated_at'
                );

            // Apply filters
            if (search) {
                query = query.where('institutions.name', 'ilike', `%${search}%`);
            }

            // Get total count
            const [{ total }] = await knex('institutions')
                .leftJoin('subscription_tiers as st', 'institutions.subscription_tier_id', 'st.id')
                .where(function() {
                    if (search) {
                        this.where('institutions.name', 'ilike', `%${search}%`);
                    }
                })
                .countDistinct('institutions.id as total');

            // Apply sorting and pagination
            const institutions = await query
                .orderBy(`institutions.${sortBy}`, sortOrder)
                .limit(limit)
                .offset(offset);

            return {
                institutions,
                pagination: {
                    page,
                    limit,
                    total: parseInt(total),
                    pages: Math.ceil(parseInt(total) / limit)
                }
            };
        } catch (error) {
            logger.error('Error getting all institutions', { error: error.message });
            throw error;
        }
    }

    /**
     * Get institution by ID
     * @param {string} id - Institution ID
     * @returns {Promise<Object>} Institution
     */
    static async getById(id) {
        try {
            const institution = await knex('institutions')
                .leftJoin('subscription_tiers as st', 'institutions.subscription_tier_id', 'st.id')
                .select(
                    'institutions.id',
                    'institutions.name',
                    'institutions.subscription_tier_id',
                    'st.name as subscription_tier_name',
                    'st.slug as subscription_tier_slug',
                    'institutions.created_at',
                    'institutions.updated_at'
                )
                .where('institutions.id', id)
                .first();

            return institution || null;
        } catch (error) {
            logger.error('Error getting institution by ID', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Update institution
     * @param {string} id - Institution ID
     * @param {Object} updates - Updates to apply { name, official_email, address, phone_number, subscription_tier_id }
     * @returns {Promise<Object>} Updated institution
     */
    static async update(id, updates) {
        try {
            const {
                name,
                official_email,
                address,
                phone_number,
                subscription_tier_id
            } = updates;

            const updateData = {
                updated_at: new Date()
            };

            if (name !== undefined) updateData.name = name;
            if (official_email !== undefined) updateData.official_email = official_email;
            if (address !== undefined) updateData.address = address;
            if (phone_number !== undefined) updateData.phone_number = phone_number;
            if (subscription_tier_id !== undefined) updateData.subscription_tier_id = subscription_tier_id;

            const [institution] = await knex('institutions')
                .where({ id })
                .update(updateData)
                .returning('*');

            if (!institution) {
                throw new Error('Institution not found');
            }

            logger.info('Institution updated successfully', { institutionId: id });
            return institution;
        } catch (error) {
            logger.error('Error updating institution', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Delete institution
     * @param {string} id - Institution ID
     * @returns {Promise<boolean>} Deletion success
     */
    static async delete(id) {
        try {
            const result = await knex('institutions')
                .where({ id })
                .del();

            if (result === 0) {
                throw new Error('Institution not found');
            }

            logger.info('Institution deleted successfully', { institutionId: id });
            return true;
        } catch (error) {
            logger.error('Error deleting institution', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Check if institution exists by name
     * @param {string} name - Institution name
     * @returns {Promise<boolean>} Exists or not
     */
    static async exists(name) {
        try {
            const institution = await knex('institutions')
                .where({ name })
                .first();

            return !!institution;
        } catch (error) {
            logger.error('Error checking institution existence', { name, error: error.message });
            throw error;
        }
    }
}

module.exports = Institution;
