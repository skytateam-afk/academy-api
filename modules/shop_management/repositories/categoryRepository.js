/**
 * Category Repository
 * Handles database operations for shop categories
 */

const knex = require('../../../config/knex');
const logger = require('../../../config/winston');

class CategoryRepository {
  /**
   * Get all categories
   */
  async getAll(options = {}) {
    try {
      const { includeInactive = false, parentId } = options;

      let query = knex('shop_categories as c')
        .leftJoin('shop_categories as parent', 'c.parent_id', 'parent.id')
        .select(
          'c.*',
          'parent.name as parent_name',
          'parent.slug as parent_slug'
        )
        .orderBy('c.display_order', 'asc')
        .orderBy('c.name', 'asc');

      if (!includeInactive) {
        query = query.where('c.is_active', true);
      }

      if (parentId !== undefined) {
        if (parentId === null) {
          query = query.whereNull('c.parent_id');
        } else {
          query = query.where('c.parent_id', parentId);
        }
      }

      const categories = await query;

      // Get product count for each category
      for (const category of categories) {
        const { count } = await knex('shop_products')
          .where('category_id', category.id)
          .where('is_published', true)
          .count('* as count')
          .first();
        
        category.product_count = parseInt(count);
      }

      return categories;
    } catch (error) {
      logger.error('Error in CategoryRepository.getAll', { error: error.message });
      throw error;
    }
  }

  /**
   * Get category by ID
   */
  async getById(id) {
    try {
      const category = await knex('shop_categories as c')
        .leftJoin('shop_categories as parent', 'c.parent_id', 'parent.id')
        .where('c.id', id)
        .select(
          'c.*',
          'parent.name as parent_name',
          'parent.slug as parent_slug'
        )
        .first();

      if (category) {
        // Get product count
        const { count } = await knex('shop_products')
          .where('category_id', id)
          .where('is_published', true)
          .count('* as count')
          .first();
        
        category.product_count = parseInt(count);

        // Get subcategories
        category.subcategories = await this.getAll({ parentId: id, includeInactive: false });
      }

      return category;
    } catch (error) {
      logger.error('Error in CategoryRepository.getById', { error: error.message, id });
      throw error;
    }
  }

  /**
   * Get category by slug
   */
  async getBySlug(slug) {
    try {
      const category = await knex('shop_categories as c')
        .leftJoin('shop_categories as parent', 'c.parent_id', 'parent.id')
        .where('c.slug', slug)
        .select(
          'c.*',
          'parent.name as parent_name',
          'parent.slug as parent_slug'
        )
        .first();

      if (category) {
        const { count } = await knex('shop_products')
          .where('category_id', category.id)
          .where('is_published', true)
          .count('* as count')
          .first();
        
        category.product_count = parseInt(count);
        category.subcategories = await this.getAll({ parentId: category.id, includeInactive: false });
      }

      return category;
    } catch (error) {
      logger.error('Error in CategoryRepository.getBySlug', { error: error.message, slug });
      throw error;
    }
  }

  /**
   * Create category
   */
  async create(categoryData) {
    try {
      // Generate slug from name if not provided
      if (!categoryData.slug) {
        let baseSlug = categoryData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        // Ensure slug is unique
        let slug = baseSlug;
        let counter = 1;
        while (await knex('shop_categories').where('slug', slug).first()) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
        categoryData.slug = slug;
      }

      // Validate parent_id if provided
      if (categoryData.parent_id) {
        const parent = await knex('shop_categories')
          .where('id', categoryData.parent_id)
          .first();
        
        if (!parent) {
          throw new Error('Parent category not found');
        }
      }

      const [category] = await knex('shop_categories')
        .insert(categoryData)
        .returning('*');

      return category;
    } catch (error) {
      logger.error('Error in CategoryRepository.create', { error: error.message });
      throw error;
    }
  }

  /**
   * Update category
   */
  async update(id, categoryData) {
    try {
      // Check if category exists
      const existing = await knex('shop_categories').where('id', id).first();
      if (!existing) {
        return null;
      }

      // Validate parent_id if provided
      if (categoryData.parent_id !== undefined) {
        if (categoryData.parent_id === id) {
          throw new Error('Cannot set category as its own parent');
        }
        
        if (categoryData.parent_id) {
          const parent = await knex('shop_categories')
            .where('id', categoryData.parent_id)
            .first();
          
          if (!parent) {
            throw new Error('Parent category not found');
          }
        }
      }

      // Generate new slug if name is being updated
      if (categoryData.name && categoryData.name !== existing.name && !categoryData.slug) {
        let baseSlug = categoryData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        let slug = baseSlug;
        let counter = 1;
        while (await knex('shop_categories').where('slug', slug).whereNot('id', id).first()) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
        categoryData.slug = slug;
      }

      const [category] = await knex('shop_categories')
        .where('id', id)
        .update({
          ...categoryData,
          updated_at: knex.fn.now()
        })
        .returning('*');

      return category;
    } catch (error) {
      logger.error('Error in CategoryRepository.update', { error: error.message, id });
      throw error;
    }
  }

  /**
   * Delete category
   */
  async delete(id) {
    try {
      // Check if category exists
      const existing = await knex('shop_categories').where('id', id).first();
      if (!existing) {
        return false;
      }

      // Check if category has products
      const { count } = await knex('shop_products')
        .where('category_id', id)
        .count('* as count')
        .first();

      if (parseInt(count) > 0) {
        throw new Error('Cannot delete category that has associated products');
      }

      // Check if category has subcategories
      const { count: subCount } = await knex('shop_categories')
        .where('parent_id', id)
        .count('* as count')
        .first();

      if (parseInt(subCount) > 0) {
        throw new Error('Cannot delete category that has child categories');
      }

      const deleted = await knex('shop_categories').where('id', id).del();
      return deleted > 0;
    } catch (error) {
      logger.error('Error in CategoryRepository.delete', { error: error.message, id });
      throw error;
    }
  }

  /**
   * Get category tree (hierarchical structure)
   */
  async getTree() {
    try {
      // Get all root categories (no parent)
      const rootCategories = await this.getAll({ parentId: null, includeInactive: false });

      // Build tree recursively
      const buildTree = async (categories) => {
        for (const category of categories) {
          category.children = await this.getAll({ parentId: category.id, includeInactive: false });
          if (category.children.length > 0) {
            await buildTree(category.children);
          }
        }
        return categories;
      };

      return await buildTree(rootCategories);
    } catch (error) {
      logger.error('Error in CategoryRepository.getTree', { error: error.message });
      throw error;
    }
  }
}

module.exports = new CategoryRepository();
