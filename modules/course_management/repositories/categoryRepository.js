/**
 * Category Repository
 * Handles all database operations for categories using Knex
 */

const knex = require('../../../config/knex');

class CategoryRepository {
  /**
   * Get all categories
   */
  async findAll(options = {}) {
    const { parent_id, include_courses = false } = options;

    let query = knex('categories')
      .select('categories.*');

    if (parent_id !== undefined) {
      if (parent_id === null) {
        query = query.whereNull('parent_id');
      } else {
        query = query.where('parent_id', parent_id);
      }
    }

    const categories = await query.orderBy('name');

    if (include_courses) {
      for (const category of categories) {
        const courseCount = await knex('courses')
          .where({ category_id: category.id })
          .count('* as count')
          .first();
        
        category.course_count = parseInt(courseCount.count);
      }
    }

    return categories;
  }

  /**
   * Get all categories with hierarchy
   */
  async findAllWithHierarchy() {
    const categories = await this.findAll();
    
    // Build hierarchy
    const categoryMap = {};
    const rootCategories = [];

    // First pass: create map
    categories.forEach(cat => {
      categoryMap[cat.id] = { ...cat, children: [] };
    });

    // Second pass: build hierarchy
    categories.forEach(cat => {
      if (cat.parent_id === null) {
        rootCategories.push(categoryMap[cat.id]);
      } else if (categoryMap[cat.parent_id]) {
        categoryMap[cat.parent_id].children.push(categoryMap[cat.id]);
      }
    });

    return rootCategories;
  }

  /**
   * Find category by ID
   */
  async findById(id) {
    return await knex('categories')
      .where({ id })
      .first();
  }

  /**
   * Find category by ID with courses
   */
  async findByIdWithCourses(id) {
    const category = await this.findById(id);
    
    if (!category) return null;

    const courses = await knex('courses')
      .where({ category_id: id })
      .orderBy('created_at', 'desc');

    category.courses = courses;
    category.course_count = courses.length;

    return category;
  }

  /**
   * Find category by name
   */
  async findByName(name) {
    return await knex('categories')
      .where({ name })
      .first();
  }

  /**
   * Find child categories
   */
  async findChildren(parentId) {
    return await knex('categories')
      .where({ parent_id: parentId })
      .orderBy('name');
  }

  /**
   * Find parent category
   */
  async findParent(categoryId) {
    const category = await this.findById(categoryId);
    
    if (!category || !category.parent_id) return null;

    return await this.findById(category.parent_id);
  }

  /**
   * Create a new category
   */
  async create(categoryData) {
    const { name, description, parent_id, icon, color } = categoryData;

    const [category] = await knex('categories')
      .insert({
        name,
        description,
        parent_id,
        icon,
        color,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      })
      .returning('*');

    return category;
  }

  /**
   * Update category
   */
  async update(id, categoryData) {
    const [category] = await knex('categories')
      .where({ id })
      .update({
        ...categoryData,
        updated_at: knex.fn.now()
      })
      .returning('*');

    return category;
  }

  /**
   * Delete category
   */
  async delete(id) {
    // Check if category has courses
    const courseCount = await knex('courses')
      .where({ category_id: id })
      .count('* as count')
      .first();

    if (parseInt(courseCount.count) > 0) {
      throw new Error('Cannot delete category with existing courses');
    }

    // Check if category has children
    const childCount = await knex('categories')
      .where({ parent_id: id })
      .count('* as count')
      .first();

    if (parseInt(childCount.count) > 0) {
      throw new Error('Cannot delete category with child categories');
    }

    await knex('categories')
      .where({ id })
      .delete();
  }

  /**
   * Get course count for category
   */
  async getCourseCount(categoryId) {
    const result = await knex('courses')
      .where({ category_id: categoryId })
      .count('* as count')
      .first();

    return parseInt(result.count);
  }

  /**
   * Get popular categories (by course count)
   */
  async findPopular(limit = 10) {
    return await knex('categories')
      .select('categories.*', knex.raw('COUNT(courses.id) as course_count'))
      .leftJoin('courses', 'categories.id', 'courses.category_id')
      .groupBy('categories.id')
      .orderBy('course_count', 'desc')
      .limit(limit);
  }

  /**
   * Check if category exists
   */
  async exists(name) {
    const category = await this.findByName(name);
    return !!category;
  }

  /**
   * Get category path (breadcrumb)
   */
  async getPath(categoryId) {
    const path = [];
    let currentId = categoryId;

    while (currentId) {
      const category = await this.findById(currentId);
      if (!category) break;

      path.unshift(category);
      currentId = category.parent_id;
    }

    return path;
  }

  /**
   * Move category to different parent
   */
  async moveToParent(categoryId, newParentId) {
    // Validate that we're not creating a circular reference
    if (newParentId) {
      const path = await this.getPath(newParentId);
      if (path.some(cat => cat.id === categoryId)) {
        throw new Error('Cannot move category to its own descendant');
      }
    }

    const [category] = await knex('categories')
      .where({ id: categoryId })
      .update({
        parent_id: newParentId,
        updated_at: knex.fn.now()
      })
      .returning('*');

    return category;
  }
}

module.exports = new CategoryRepository();
