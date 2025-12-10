/**
 * Category Model
 * Handles course category operations with hierarchical support
 */

const knex = require('../../../config/knex');
const logger = require('../../../config/winston');
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
            
            let query = knex('categories as c')
                .select(
                    'c.*',
                    knex.raw('COUNT(co.id) as course_count'),
                    knex('categories')
                        .select('name')
                        .whereRaw('id = c.parent_id')
                        .as('parent_name')
                )
                .leftJoin('courses as co', 'co.category_id', 'c.id')
                .groupBy('c.id');

            if (parentId !== undefined) {
                if (parentId === null) {
                    query = query.whereNull('c.parent_id');
                } else {
                    query = query.where('c.parent_id', parentId);
                }
            }

            if (isActive !== undefined) {
                query = query.where('c.is_active', isActive);
            }

            const categories = await query.orderBy([
                { column: 'c.display_order', order: 'asc' },
                { column: 'c.name', order: 'asc' }
            ]);
            
            // If includeChildren is true, fetch children for each category
            if (includeChildren) {
                for (let category of categories) {
                    const children = await knex('categories as c')
                        .select('c.*', knex.raw('COUNT(co.id) as course_count'))
                        .leftJoin('courses as co', 'co.category_id', 'c.id')
                        .where('c.parent_id', category.id)
                        .groupBy('c.id')
                        .orderBy([
                            { column: 'c.display_order', order: 'asc' },
                            { column: 'c.name', order: 'asc' }
                        ]);
                    
                    category.children = children;
                }
            }

            return categories;
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
            const category = await knex('categories as c')
                .select(
                    'c.*',
                    knex.raw('COUNT(co.id) as course_count'),
                    knex('categories')
                        .select('name')
                        .whereRaw('id = c.parent_id')
                        .as('parent_name')
                )
                .leftJoin('courses as co', 'co.category_id', 'c.id')
                .where('c.id', id)
                .groupBy('c.id')
                .first();

            if (!category) {
                return null;
            }

            // Get children
            const children = await knex('categories as c')
                .select('c.*', knex.raw('COUNT(co.id) as course_count'))
                .leftJoin('courses as co', 'co.category_id', 'c.id')
                .where('c.parent_id', id)
                .groupBy('c.id')
                .orderBy([
                    { column: 'c.display_order', order: 'asc' },
                    { column: 'c.name', order: 'asc' }
                ]);

            category.children = children;

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
            const category = await knex('categories as c')
                .select('c.*', knex.raw('COUNT(co.id) as course_count'))
                .leftJoin('courses as co', 'co.category_id', 'c.id')
                .where('c.slug', slug)
                .groupBy('c.id')
                .first();

            return category || null;
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
        const trx = await knex.transaction();
        
        try {
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

            const [category] = await trx('categories')
                .insert({
                    name,
                    slug,
                    description: description || null,
                    parent_id: parentId || null,
                    icon_url: iconUrl || null,
                    display_order: displayOrder || 0,
                    is_active: isActive !== false
                })
                .returning('*');

            await trx.commit();

            logger.info('Category created', { categoryId: category.id, name });
            return category;
        } catch (error) {
            await trx.rollback();
            logger.error('Error creating category', { error: error.message });
            throw error;
        }
    }

    /**
     * Update category
     * @param {string} id - Category ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object>} Updated category
     */
    static async update(id, updateData) {
        const trx = await knex.transaction();
        
        try {
            const category = await this.getById(id);
            if (!category) {
                throw new Error('Category not found');
            }

            const { name, description, parentId, iconUrl, displayOrder, isActive } = updateData;
            
            const updates = { updated_at: knex.fn.now() };
            
            // Generate new slug if name changed
            if (name && name !== category.name) {
                const slug = slugify(name, { lower: true, strict: true });
                
                // Check if new slug already exists
                const existingCategory = await this.getBySlug(slug);
                if (existingCategory && existingCategory.id !== id) {
                    throw new Error('Category with this name already exists');
                }
                
                updates.name = name;
                updates.slug = slug;
            }

            // Validate parent category if provided
            if (parentId !== undefined) {
                if (parentId === id) {
                    throw new Error('Category cannot be its own parent');
                }
                
                if (parentId) {
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
                
                updates.parent_id = parentId;
            }

            if (description !== undefined) {
                updates.description = description;
            }

            if (iconUrl !== undefined) {
                updates.icon_url = iconUrl;
            }

            if (displayOrder !== undefined) {
                updates.display_order = displayOrder;
            }

            if (isActive !== undefined) {
                updates.is_active = isActive;
            }

            const [updatedCategory] = await trx('categories')
                .where({ id })
                .update(updates)
                .returning('*');

            await trx.commit();

            logger.info('Category updated', { categoryId: id });
            return updatedCategory;
        } catch (error) {
            await trx.rollback();
            logger.error('Error updating category', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Delete category
     * @param {string} id - Category ID
     * @returns {Promise<boolean>} Success status
     */
    static async delete(id) {
        const trx = await knex.transaction();
        
        try {
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

            await trx('categories')
                .where({ id })
                .delete();

            await trx.commit();

            logger.info('Category deleted', { categoryId: id });
            return true;
        } catch (error) {
            await trx.rollback();
            logger.error('Error deleting category', { id, error: error.message });
            throw error;
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
        const trx = await knex.transaction();
        
        try {
            for (const item of orderData) {
                await trx('categories')
                    .where({ id: item.id })
                    .update({ display_order: item.displayOrder });
            }

            await trx.commit();

            logger.info('Categories reordered', { count: orderData.length });
            return true;
        } catch (error) {
            await trx.rollback();
            logger.error('Error reordering categories', { error: error.message });
            throw error;
        }
    }
}

module.exports = Category;
