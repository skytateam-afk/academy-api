/**
 * Library Category Repository
 * Handles all database operations for library categories using Knex
 */

const knex = require('../../../config/knex');
const logger = require('../../../config/winston');

class LibraryCategoryRepository {
  /**
   * Get all categories
   */
  async findAll(options = {}) {
    try {
      const { isActive } = options;
      
      let query = knex('library_categories')
        .select('*')
        .orderBy('sort_order', 'asc')
        .orderBy('name', 'asc');

      if (isActive !== undefined) {
        query = query.where('is_active', isActive);
      }

      return await query;
    } catch (error) {
      logger.error('Error in findAll:', error);
      throw error;
    }
  }

  /**
   * Find category by ID
   */
  async findById(id) {
    try {
      return await knex('library_categories')
        .where({ id })
        .first();
    } catch (error) {
      logger.error(`Error finding category ${id}:`, error);
      throw error;
    }
  }

  /**
   * Find category by slug
   */
  async findBySlug(slug) {
    try {
      return await knex('library_categories')
        .where({ slug })
        .first();
    } catch (error) {
      logger.error(`Error finding category by slug ${slug}:`, error);
      throw error;
    }
  }

  /**
   * Find category by name (case-insensitive)
   */
  async findByName(name) {
    try {
      return await knex('library_categories')
        .whereRaw('LOWER(name) = LOWER(?)', [name])
        .first();
    } catch (error) {
      logger.error(`Error finding category by name ${name}:`, error);
      throw error;
    }
  }

  /**
   * Create new category
   */
  async create(categoryData) {
    try {
      const { name, slug, description, icon, sort_order, is_active } = categoryData;

      const [category] = await knex('library_categories')
        .insert({
          name,
          slug,
          description,
          icon,
          sort_order: sort_order || 0,
          is_active: is_active !== undefined ? is_active : true,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      return category;
    } catch (error) {
      logger.error('Error creating category:', error);
      throw error;
    }
  }

  /**
   * Update category
   */
  async update(id, categoryData) {
    try {
      const [category] = await knex('library_categories')
        .where({ id })
        .update({
          ...categoryData,
          updated_at: new Date()
        })
        .returning('*');

      return category;
    } catch (error) {
      logger.error(`Error updating category ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete category
   */
  async delete(id) {
    try {
      const count = await knex('library_categories')
        .where({ id })
        .delete();

      return count > 0;
    } catch (error) {
      logger.error(`Error deleting category ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get category with item count
   */
  async findByIdWithItemCount(id) {
    try {
      const category = await knex('library_categories')
        .select('library_categories.*')
        .where('library_categories.id', id)
        .first();

      if (!category) return null;

      const itemCount = await knex('library_items')
        .where({ category_id: id })
        .count('* as count')
        .first();

      category.item_count = parseInt(itemCount.count);

      return category;
    } catch (error) {
      logger.error(`Error finding category with item count ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all categories with item counts
   */
  async findAllWithItemCounts() {
    try {
      return await knex('library_categories')
        .select(
          'library_categories.*',
          knex.raw('COUNT(library_items.id) as item_count')
        )
        .leftJoin('library_items', 'library_categories.id', 'library_items.category_id')
        .groupBy('library_categories.id')
        .orderBy('library_categories.sort_order', 'asc')
        .orderBy('library_categories.name', 'asc');
    } catch (error) {
      logger.error('Error finding categories with item counts:', error);
      throw error;
    }
  }
}

module.exports = new LibraryCategoryRepository();
