/**
 * Category Model
 * Handles course category operations with hierarchical support
 */

const { pool } = require('../config/database');
const logger = require('../config/winston');
const slugify = require('slugify');

class Category {
    /**
     * Get all categories with optional filtering
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Categories
     */
    static async getAll(options = {}) {
        try {
            const { parentId, isActive, includeChildren } = options;
            
            let query = `
                SELECT 
                    c.*,
                    COUNT(co.id) as course_count,
                    CASE WHEN c.parent_id IS NOT NULL THEN
                        (SELECT name FROM categories WHERE id = c.parent_id)
                    ELSE NULL END as parent_name
                FROM categories c
                LEFT JOIN courses co ON co.category_id = c.id
                WHERE 1=1
            `;
            
            const params = [];
            let paramCount = 1;

            if (parentId !== undefined) {
                if (parentId === null) {
                    query += ` AND c.parent_id IS NULL`;
                } else {
                    query += ` AND c.parent_id = $${paramCount}`;
                    params.push(parentId);
                    paramCount++;
                }
            }

            if (isActive !== undefined) {
                query += ` AND c.is_active = $${paramCount}`;
                params.push(isActive);
                paramCount++;
            }

            query += ` GROUP BY c.id ORDER BY c.display_order ASC, c.name ASC`;

            const result = await pool.query(query, params);
            
            // If includeChildren is true, fetch children for each category
            if (includeChildren) {
                for (let category of result.rows) {
                    const childrenResult = await pool.query(
                        `SELECT c.*, COUNT(co.id) as course_count
                         FROM categories c
                         LEFT JOIN courses co ON co.category_id = c.id
                         WHERE c.parent_id = $1
                         GROUP BY c.id
                         ORDER BY c.display_order ASC, c.name ASC`,
                        [category.id]
                    );
                    category.children = childrenResult.rows;
                }
            }

            return result.rows;
        } catch (error) {
            logger.error('Error getting categories', { error: error.message });
            throw error;
        }
    }

    /**
     * Get category by ID
     * @param {string} id - Category ID
     * @returns {Promise<Object>} Category
     */
    static async getById(id) {
        try {
            const result = await pool.query(
                `SELECT 
                    c.*,
                    COUNT(co.id) as course_count,
                    CASE WHEN c.parent_id IS NOT NULL THEN
                        (SELECT name FROM categories WHERE id = c.parent_id)
                    ELSE NULL END as parent_name
                FROM categories c
                LEFT JOIN courses co ON co.category_id = c.id
                WHERE c.id = $1
                GROUP BY c.id`,
                [id]
            );

            if (result.rows.length === 0) {
                return null;
            }

            // Get children
            const childrenResult = await pool.query(
                `SELECT c.*, COUNT(co.id) as course_count
                 FROM categories c
                 LEFT JOIN courses co ON co.category_id = c.id
                 WHERE c.parent_id = $1
                 GROUP BY c.id
                 ORDER BY c.display_order ASC, c.name ASC`,
                [id]
            );

            const category = result.rows[0];
            category.children = childrenResult.rows;

            return category;
        } catch (error) {
            logger.error('Error getting category by ID', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Get category by slug
     * @param {string} slug - Category slug
     * @returns {Promise<Object>} Category
     */
    static async getBySlug(slug) {
        try {
            const result = await pool.query(
                `SELECT 
                    c.*,
                    COUNT(co.id) as course_count
                FROM categories c
                LEFT JOIN courses co ON co.category_id = c.id
                WHERE c.slug = $1
                GROUP BY c.id`,
                [slug]
            );

            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (error) {
            logger.error('Error getting category by slug', { slug, error: error.message });
            throw error;
        }
    }

    /**
     * Create new category
     * @param {Object} categoryData - Category data
     * @returns {Promise<Object>} Created category
     */
    static async create(categoryData) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            const { name, description, parentId, iconUrl, displayOrder, isActive } = categoryData;
            
            // Generate slug
            const slug = slugify(name, { lower: true, strict: true });

            // Check if slug already exists
            const existingCategory = await this.getBySlug(slug);
            if (existingCategory) {
                throw new Error('Category with this name already exists');
            }

            // Validate parent category if provided
            if (parentId) {
                const parentCategory = await this.getById(parentId);
                if (!parentCategory) {
                    throw new Error('Parent category not found');
                }
            }

            const result = await client.query(
                `INSERT INTO categories (name, slug, description, parent_id, icon_url, display_order, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING *`,
                [name, slug, description || null, parentId || null, iconUrl || null, displayOrder || 0, isActive !== false]
            );

            await client.query('COMMIT');

            logger.info('Category created', { categoryId: result.rows[0].id, name });
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error creating category', { error: error.message });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Update category
     * @param {string} id - Category ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object>} Updated category
     */
    static async update(id, updateData) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            const category = await this.getById(id);
            if (!category) {
                throw new Error('Category not found');
            }

            const { name, description, parentId, iconUrl, displayOrder, isActive } = updateData;
            
            // Generate new slug if name changed
            let slug = category.slug;
            if (name && name !== category.name) {
                slug = slugify(name, { lower: true, strict: true });
                
                // Check if new slug already exists
                const existingCategory = await this.getBySlug(slug);
                if (existingCategory && existingCategory.id !== id) {
                    throw new Error('Category with this name already exists');
                }
            }

            // Validate parent category if provided
            if (parentId) {
                if (parentId === id) {
                    throw new Error('Category cannot be its own parent');
                }
                
                const parentCategory = await this.getById(parentId);
                if (!parentCategory) {
                    throw new Error('Parent category not found');
                }

                // Check for circular reference
                let currentParent = parentCategory;
                while (currentParent.parent_id) {
                    if (currentParent.parent_id === id) {
                        throw new Error('Circular parent reference detected');
                    }
                    currentParent = await this.getById(currentParent.parent_id);
                }
            }

            const result = await client.query(
                `UPDATE categories 
                 SET name = COALESCE($1, name),
                     slug = COALESCE($2, slug),
                     description = COALESCE($3, description),
                     parent_id = COALESCE($4, parent_id),
                     icon_url = COALESCE($5, icon_url),
                     display_order = COALESCE($6, display_order),
                     is_active = COALESCE($7, is_active),
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $8
                 RETURNING *`,
                [
                    name || null,
                    slug,
                    description !== undefined ? description : null,
                    parentId !== undefined ? parentId : null,
                    iconUrl !== undefined ? iconUrl : null,
                    displayOrder !== undefined ? displayOrder : null,
                    isActive !== undefined ? isActive : null,
                    id
                ]
            );

            await client.query('COMMIT');

            logger.info('Category updated', { categoryId: id });
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error updating category', { id, error: error.message });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Delete category
     * @param {string} id - Category ID
     * @returns {Promise<boolean>} Success status
     */
    static async delete(id) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            const category = await this.getById(id);
            if (!category) {
                throw new Error('Category not found');
            }

            // Check if category has courses
            if (parseInt(category.course_count) > 0) {
                throw new Error('Cannot delete category with associated courses');
            }

            // Check if category has children
            if (category.children && category.children.length > 0) {
                throw new Error('Cannot delete category with subcategories');
            }

            await client.query('DELETE FROM categories WHERE id = $1', [id]);

            await client.query('COMMIT');

            logger.info('Category deleted', { categoryId: id });
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error deleting category', { id, error: error.message });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get category tree (hierarchical structure)
     * @returns {Promise<Array>} Category tree
     */
    static async getTree() {
        try {
            // Get all root categories (no parent)
            const rootCategories = await this.getAll({ parentId: null, includeChildren: true });
            
            return rootCategories;
        } catch (error) {
            logger.error('Error getting category tree', { error: error.message });
            throw error;
        }
    }

    /**
     * Reorder categories
     * @param {Array} orderData - Array of {id, displayOrder}
     * @returns {Promise<boolean>} Success status
     */
    static async reorder(orderData) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            for (const item of orderData) {
                await client.query(
                    'UPDATE categories SET display_order = $1 WHERE id = $2',
                    [item.displayOrder, item.id]
                );
            }

            await client.query('COMMIT');

            logger.info('Categories reordered', { count: orderData.length });
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error reordering categories', { error: error.message });
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = Category;
