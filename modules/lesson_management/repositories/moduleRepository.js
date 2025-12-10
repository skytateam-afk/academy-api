/**
 * Module Repository
 * Handles all database operations for lesson modules
 */

const knex = require('../../../config/knex');

class ModuleRepository {
  /**
   * Find all modules for a lesson
   */
  async findByLesson(lessonId, options = {}) {
    const { page = 1, limit = 50, isPublished } = options;
    const offset = (page - 1) * limit;

    let query = knex('lesson_modules')
      .where('lesson_id', lessonId)
      .orderBy('order_index', 'asc');

    if (isPublished !== undefined) {
      query = query.where('is_published', isPublished);
    }

    const [modules, [{ count }]] = await Promise.all([
      query.limit(limit).offset(offset),
      knex('lesson_modules')
        .where('lesson_id', lessonId)
        .count('* as count')
    ]);

    return {
      data: modules,
      pagination: {
        page,
        limit,
        total: parseInt(count),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Find module by ID
   */
  async findById(id) {
    return knex('lesson_modules')
      .where('id', id)
      .first();
  }

  /**
   * Find module by slug within a lesson
   */
  async findBySlug(lessonId, slug) {
    return knex('lesson_modules')
      .where({ lesson_id: lessonId, slug })
      .first();
  }

  /**
   * Create a new module
   */
  async create(moduleData) {
    const [module] = await knex('lesson_modules')
      .insert(moduleData)
      .returning('*');
    return module;
  }

  /**
   * Update a module
   */
  async update(id, updates) {
    const [module] = await knex('lesson_modules')
      .where('id', id)
      .update({
        ...updates,
        updated_at: knex.fn.now()
      })
      .returning('*');
    return module;
  }

  /**
   * Delete a module
   */
  async delete(id) {
    return knex('lesson_modules')
      .where('id', id)
      .del();
  }

  /**
   * Reorder modules within a lesson
   */
  async reorder(lessonId, moduleOrders) {
    const trx = await knex.transaction();
    
    try {
      for (const { id, order_index } of moduleOrders) {
        await trx('lesson_modules')
          .where({ id, lesson_id: lessonId })
          .update({ order_index });
      }
      
      await trx.commit();
      return true;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  /**
   * Duplicate a module
   */
  async duplicate(id, newTitle) {
    const module = await this.findById(id);
    if (!module) return null;

    const { id: _, created_at, updated_at, ...moduleData } = module;
    
    // Generate new slug
    const baseSlug = moduleData.slug + '-copy';
    let slug = baseSlug;
    let counter = 1;
    
    while (await this.findBySlug(module.lesson_id, slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const duplicatedModule = await this.create({
      ...moduleData,
      title: newTitle || `${module.title} (Copy)`,
      slug,
      version: 1,
      previous_version_id: null
    });

    return duplicatedModule;
  }

  /**
   * Get module statistics for a lesson
   */
  async getStatistics(lessonId) {
    const stats = await knex('lesson_modules')
      .where('lesson_id', lessonId)
      .select(
        knex.raw('COUNT(*) as total_modules'),
        knex.raw('COUNT(*) FILTER (WHERE is_published = true) as published_modules'),
        knex.raw('COUNT(*) FILTER (WHERE is_published = false) as draft_modules'),
        knex.raw('COUNT(*) FILTER (WHERE content_type = ?) as video_modules', ['video']),
        knex.raw('COUNT(*) FILTER (WHERE content_type = ?) as audio_modules', ['audio']),
        knex.raw('COUNT(*) FILTER (WHERE content_type = ?) as text_modules', ['text']),
        knex.raw('COUNT(*) FILTER (WHERE content_type = ?) as document_modules', ['document']),
        knex.raw('SUM(duration_minutes) as total_duration_minutes')
      )
      .first();

    return {
      total_modules: parseInt(stats.total_modules) || 0,
      published_modules: parseInt(stats.published_modules) || 0,
      draft_modules: parseInt(stats.draft_modules) || 0,
      video_modules: parseInt(stats.video_modules) || 0,
      audio_modules: parseInt(stats.audio_modules) || 0,
      text_modules: parseInt(stats.text_modules) || 0,
      document_modules: parseInt(stats.document_modules) || 0,
      total_duration_minutes: parseInt(stats.total_duration_minutes) || 0
    };
  }

  /**
   * Search modules within a lesson
   */
  async search(lessonId, query, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const searchQuery = knex('lesson_modules')
      .where('lesson_id', lessonId)
      .where(function() {
        this.where('title', 'ilike', `%${query}%`)
          .orWhere('description', 'ilike', `%${query}%`)
          .orWhere('text_content', 'ilike', `%${query}%`);
      })
      .orderBy('order_index', 'asc');

    const [modules, [{ count }]] = await Promise.all([
      searchQuery.limit(limit).offset(offset),
      knex('lesson_modules')
        .where('lesson_id', lessonId)
        .where(function() {
          this.where('title', 'ilike', `%${query}%`)
            .orWhere('description', 'ilike', `%${query}%`)
            .orWhere('text_content', 'ilike', `%${query}%`);
        })
        .count('* as count')
    ]);

    return {
      data: modules,
      pagination: {
        page,
        limit,
        total: parseInt(count),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Get module version history
   */
  async findVersionHistory(moduleId) {
    const versions = [];
    let currentId = moduleId;

    while (currentId) {
      const module = await this.findById(currentId);
      if (!module) break;
      
      versions.push(module);
      currentId = module.previous_version_id;
    }

    return versions;
  }

  /**
   * Create new version of a module
   */
  async createVersion(id, updates) {
    const currentModule = await this.findById(id);
    if (!currentModule) return null;

    // Create new version
    const { id: _, created_at, updated_at, ...moduleData } = currentModule;
    
    const newVersion = await this.create({
      ...moduleData,
      ...updates,
      version: currentModule.version + 1,
      previous_version_id: id,
      published_at: null
    });

    return newVersion;
  }

  /**
   * Toggle publish status
   */
  async togglePublish(id, isPublished) {
    const updates = { is_published: isPublished };
    
    if (isPublished) {
      updates.published_at = knex.fn.now();
    }

    return this.update(id, updates);
  }

  /**
   * Get modules with attachments
   */
  async findWithAttachments(lessonId) {
    const modules = await knex('lesson_modules')
      .where('lesson_id', lessonId)
      .orderBy('order_index', 'asc');

    for (const module of modules) {
      module.attachments = await knex('module_attachments')
        .where('module_id', module.id)
        .orderBy('order_index', 'asc');
    }

    return modules;
  }

  /**
   * Count modules by lesson
   */
  async countByLesson(lessonId) {
    const [{ count }] = await knex('lesson_modules')
      .where('lesson_id', lessonId)
      .count('* as count');
    
    return parseInt(count);
  }

  /**
   * Get next order index for a lesson
   */
  async getNextOrderIndex(lessonId) {
    const result = await knex('lesson_modules')
      .where('lesson_id', lessonId)
      .max('order_index as max_order');
    
    return (result[0].max_order || -1) + 1;
  }

  /**
   * Bulk create modules
   */
  async bulkCreate(lessonId, modulesData) {
    const modules = modulesData.map((data, index) => ({
      lesson_id: lessonId,
      order_index: data.order_index !== undefined ? data.order_index : index,
      ...data
    }));

    return knex('lesson_modules')
      .insert(modules)
      .returning('*');
  }

  /**
   * Get modules by content type
   */
  async findByContentType(lessonId, contentType) {
    return knex('lesson_modules')
      .where({ lesson_id: lessonId, content_type: contentType })
      .orderBy('order_index', 'asc');
  }

  /**
   * Check if slug exists in lesson
   */
  async slugExists(lessonId, slug, excludeId = null) {
    let query = knex('lesson_modules')
      .where({ lesson_id: lessonId, slug });

    if (excludeId) {
      query = query.whereNot('id', excludeId);
    }

    const module = await query.first();
    return !!module;
  }
}

module.exports = new ModuleRepository();
