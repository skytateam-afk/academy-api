/**
 * Tag Model
 * System-wide tagging/metadata management
 * Supports polymorphic tagging for any resource type
 */

const db = require('../config/database');
const logger = require('../config/winston');

class Tag {
    /**
     * Get all tags
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Tags
     */
    static async getAll(options = {}) {
        const {
            search = '',
            tag_key = null,
            tag_type = null,
            category_id = null,
            page = 1,
            limit = 100
        } = options;

        const offset = (page - 1) * limit;
        const conditions = [];
        const values = [];
        let paramCount = 1;

        if (search) {
            conditions.push(`(
                st.tag_key ILIKE $${paramCount} OR 
                st.tag_value ILIKE $${paramCount} OR
                st.description ILIKE $${paramCount}
            )`);
            values.push(`%${search}%`);
            paramCount++;
        }

        if (tag_key) {
            conditions.push(`st.tag_key = $${paramCount}`);
            values.push(tag_key);
            paramCount++;
        }

        if (tag_type) {
            conditions.push(`st.tag_type = $${paramCount}`);
            values.push(tag_type);
            paramCount++;
        }

        if (category_id) {
            conditions.push(`st.category_id = $${paramCount}`);
            values.push(category_id);
            paramCount++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
            SELECT 
                st.*,
                tc.name as category_name,
                tc.color as category_color,
                COUNT(rt.id) as usage_count
            FROM system_tags st
            LEFT JOIN tag_categories tc ON st.category_id = tc.id
            LEFT JOIN resource_tags rt ON st.id = rt.tag_id
            ${whereClause}
            GROUP BY st.id, tc.name, tc.color
            ORDER BY st.tag_key, st.tag_value
            LIMIT $${paramCount} OFFSET $${paramCount + 1}
        `;

        values.push(limit, offset);
        const result = await db.query(query, values);
        return result.rows;
    }

    /**
     * Get tag by ID
     * @param {string} tagId - Tag ID
     * @returns {Promise<Object|null>} Tag
     */
    static async getById(tagId) {
        const query = `
            SELECT 
                st.*,
                tc.name as category_name,
                tc.color as category_color
            FROM system_tags st
            LEFT JOIN tag_categories tc ON st.category_id = tc.id
            WHERE st.id = $1
        `;

        const result = await db.query(query, [tagId]);
        return result.rows[0] || null;
    }

    /**
     * Create a new tag
     * @param {Object} tagData - Tag data
     * @returns {Promise<Object>} Created tag
     */
    static async create(tagData) {
        const {
            tag_key,
            tag_value,
            description = null,
            tag_type = 'custom',
            category_id = null,
            created_by = null
        } = tagData;

        const query = `
            INSERT INTO system_tags (
                tag_key, tag_value, description, tag_type, category_id, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (tag_key, tag_value) 
            DO UPDATE SET 
                description = EXCLUDED.description,
                tag_type = EXCLUDED.tag_type,
                category_id = EXCLUDED.category_id,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;

        const result = await db.query(query, [
            tag_key.toLowerCase().trim(),
            tag_value.toLowerCase().trim(),
            description,
            tag_type,
            category_id,
            created_by
        ]);

        logger.info('Tag created', {
            tagId: result.rows[0].id,
            tag_key,
            tag_value
        });

        return result.rows[0];
    }

    /**
     * Update a tag
     * @param {string} tagId - Tag ID
     * @param {Object} updates - Tag updates
     * @returns {Promise<Object>} Updated tag
     */
    static async update(tagId, updates) {
        const allowedFields = ['description', 'tag_type', 'category_id'];
        const fields = [];
        const values = [];
        let paramCount = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        }

        if (fields.length === 0) {
            throw new Error('No valid fields to update');
        }

        values.push(tagId);

        const query = `
            UPDATE system_tags
            SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await db.query(query, values);

        if (result.rows.length === 0) {
            throw new Error('Tag not found');
        }

        logger.info('Tag updated', { tagId });
        return result.rows[0];
    }

    /**
     * Delete a tag
     * @param {string} tagId - Tag ID
     * @returns {Promise<boolean>} Success status
     */
    static async delete(tagId) {
        // Check if tag is system tag
        const tag = await this.getById(tagId);
        if (tag && tag.tag_type === 'system') {
            throw new Error('Cannot delete system tags');
        }

        const query = 'DELETE FROM system_tags WHERE id = $1';
        const result = await db.query(query, [tagId]);

        logger.info('Tag deleted', { tagId });
        return result.rowCount > 0;
    }

    /**
     * Get all tag keys (unique)
     * @returns {Promise<Array>} Tag keys
     */
    static async getTagKeys() {
        const query = `
            SELECT DISTINCT tag_key, COUNT(*) as value_count
            FROM system_tags
            GROUP BY tag_key
            ORDER BY tag_key
        `;

        const result = await db.query(query);
        return result.rows;
    }

    /**
     * Get tag values for a specific key
     * @param {string} tagKey - Tag key
     * @returns {Promise<Array>} Tag values
     */
    static async getTagValues(tagKey) {
        const query = `
            SELECT 
                st.*,
                tc.name as category_name,
                tc.color as category_color,
                COUNT(rt.id) as usage_count
            FROM system_tags st
            LEFT JOIN tag_categories tc ON st.category_id = tc.id
            LEFT JOIN resource_tags rt ON st.id = rt.tag_id
            WHERE st.tag_key = $1
            GROUP BY st.id, tc.name, tc.color
            ORDER BY st.tag_value
        `;

        const result = await db.query(query, [tagKey]);
        return result.rows;
    }

    /**
     * Get or create a tag
     * @param {string} tagKey - Tag key
     * @param {string} tagValue - Tag value
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Tag
     */
    static async getOrCreate(tagKey, tagValue, options = {}) {
        const query = `
            INSERT INTO system_tags (tag_key, tag_value, description, tag_type, category_id, created_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (tag_key, tag_value) 
            DO UPDATE SET updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;

        const result = await db.query(query, [
            tagKey.toLowerCase().trim(),
            tagValue.toLowerCase().trim(),
            options.description || null,
            options.tag_type || 'custom',
            options.category_id || null,
            options.created_by || null
        ]);

        return result.rows[0];
    }

    /**
     * Tag a resource
     * @param {Object} tagData - Tag data
     * @returns {Promise<Object>} Resource tag
     */
    static async tagResource(tagData) {
        const {
            resource_type,
            resource_id,
            tag_key,
            tag_value,
            tagged_by = null,
            tag_description = null,
            tag_type = 'custom',
            category_id = null
        } = tagData;

        // Get or create the tag
        const tag = await this.getOrCreate(tag_key, tag_value, {
            description: tag_description,
            tag_type,
            category_id,
            created_by: tagged_by
        });

        // Create resource tag association
        const query = `
            INSERT INTO resource_tags (tag_id, resource_type, resource_id, tagged_by)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (resource_type, resource_id, tag_id) DO NOTHING
            RETURNING *
        `;

        const result = await db.query(query, [
            tag.id,
            resource_type,
            resource_id,
            tagged_by
        ]);

        logger.info('Resource tagged', {
            resource_type,
            resource_id,
            tag_key,
            tag_value
        });

        return {
            ...result.rows[0],
            tag
        };
    }

    /**
     * Untag a resource
     * @param {string} resource_type - Resource type
     * @param {string} resource_id - Resource ID
     * @param {string} tagId - Tag ID
     * @returns {Promise<boolean>} Success status
     */
    static async untagResource(resource_type, resource_id, tagId) {
        const query = `
            DELETE FROM resource_tags
            WHERE resource_type = $1 AND resource_id = $2 AND tag_id = $3
        `;

        const result = await db.query(query, [resource_type, resource_id, tagId]);

        logger.info('Resource untagged', {
            resource_type,
            resource_id,
            tagId
        });

        return result.rowCount > 0;
    }

    /**
     * Get tags for a resource
     * @param {string} resource_type - Resource type
     * @param {string} resource_id - Resource ID
     * @returns {Promise<Array>} Tags
     */
    static async getResourceTags(resource_type, resource_id) {
        const query = `
            SELECT 
                st.*,
                tc.name as category_name,
                tc.color as category_color,
                tc.icon as category_icon,
                rt.tagged_by,
                rt.tagged_at,
                u.username as tagged_by_username
            FROM resource_tags rt
            JOIN system_tags st ON rt.tag_id = st.id
            LEFT JOIN tag_categories tc ON st.category_id = tc.id
            LEFT JOIN users u ON rt.tagged_by = u.id
            WHERE rt.resource_type = $1 AND rt.resource_id = $2
            ORDER BY st.tag_key, st.tag_value
        `;

        const result = await db.query(query, [resource_type, resource_id]);
        return result.rows;
    }

    /**
     * Search resources by tags
     * @param {string} resource_type - Resource type
     * @param {Array} tags - Array of {tag_key, tag_value} objects
     * @param {string} match_type - 'all' or 'any'
     * @returns {Promise<Array>} Resource IDs
     */
    static async searchResourcesByTags(resource_type, tags, match_type = 'all') {
        if (!tags || tags.length === 0) {
            return [];
        }

        // Build tag conditions
        const tagConditions = tags.map((tag, index) => {
            return `(st.tag_key = $${index * 2 + 2} AND st.tag_value = $${index * 2 + 3})`;
        });

        const values = [resource_type];
        tags.forEach(tag => {
            values.push(tag.tag_key, tag.tag_value);
        });

        let query;
        if (match_type === 'all') {
            // Resources must have ALL specified tags
            query = `
                SELECT rt.resource_id
                FROM resource_tags rt
                JOIN system_tags st ON rt.tag_id = st.id
                WHERE rt.resource_type = $1
                AND (${tagConditions.join(' OR ')})
                GROUP BY rt.resource_id
                HAVING COUNT(DISTINCT st.id) = ${tags.length}
            `;
        } else {
            // Resources must have ANY of the specified tags
            query = `
                SELECT DISTINCT rt.resource_id
                FROM resource_tags rt
                JOIN system_tags st ON rt.tag_id = st.id
                WHERE rt.resource_type = $1
                AND (${tagConditions.join(' OR ')})
            `;
        }

        const result = await db.query(query, values);
        return result.rows.map(row => row.resource_id);
    }

    /**
     * Get tag categories
     * @returns {Promise<Array>} Tag categories
     */
    static async getCategories() {
        const query = `
            SELECT 
                tc.*,
                COUNT(st.id) as tag_count
            FROM tag_categories tc
            LEFT JOIN system_tags st ON tc.id = st.category_id
            GROUP BY tc.id
            ORDER BY tc.name
        `;

        const result = await db.query(query);
        return result.rows;
    }

    /**
     * Bulk tag resources
     * @param {Array} resources - Array of {resource_type, resource_id}
     * @param {Array} tags - Array of {tag_key, tag_value}
     * @param {string} tagged_by - User ID
     * @returns {Promise<number>} Number of tags applied
     */
    static async bulkTagResources(resources, tags, tagged_by = null) {
        let count = 0;

        for (const resource of resources) {
            for (const tag of tags) {
                try {
                    await this.tagResource({
                        resource_type: resource.resource_type,
                        resource_id: resource.resource_id,
                        tag_key: tag.tag_key,
                        tag_value: tag.tag_value,
                        tagged_by
                    });
                    count++;
                } catch (error) {
                    logger.error('Error in bulk tagging', {
                        resource,
                        tag,
                        error: error.message
                    });
                }
            }
        }

        logger.info('Bulk tagging completed', {
            resources: resources.length,
            tags: tags.length,
            tagged_count: count
        });

        return count;
    }
}

module.exports = Tag;
