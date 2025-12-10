/**
 * Module Attachment Repository
 * Handles all database operations for module attachments
 */

const knex = require('../../../config/knex');

class ModuleAttachmentRepository {
  /**
   * Find all attachments for a module
   */
  async findByModule(moduleId) {
    return knex('module_attachments')
      .where('module_id', moduleId)
      .orderBy('order_index', 'asc');
  }

  /**
   * Find attachment by ID
   */
  async findById(id) {
    return knex('module_attachments')
      .where('id', id)
      .first();
  }

  /**
   * Create a new attachment
   */
  async create(attachmentData) {
    const [attachment] = await knex('module_attachments')
      .insert(attachmentData)
      .returning('*');
    return attachment;
  }

  /**
   * Update an attachment
   */
  async update(id, updates) {
    const [attachment] = await knex('module_attachments')
      .where('id', id)
      .update({
        ...updates,
        updated_at: knex.fn.now()
      })
      .returning('*');
    return attachment;
  }

  /**
   * Delete an attachment
   */
  async delete(id) {
    return knex('module_attachments')
      .where('id', id)
      .del();
  }

  /**
   * Bulk create attachments
   */
  async bulkCreate(moduleId, attachmentsData) {
    const attachments = attachmentsData.map((data, index) => ({
      module_id: moduleId,
      order_index: data.order_index !== undefined ? data.order_index : index,
      ...data
    }));

    return knex('module_attachments')
      .insert(attachments)
      .returning('*');
  }

  /**
   * Reorder attachments within a module
   */
  async reorder(moduleId, attachmentOrders) {
    const trx = await knex.transaction();
    
    try {
      for (const { id, order_index } of attachmentOrders) {
        await trx('module_attachments')
          .where({ id, module_id: moduleId })
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
   * Delete all attachments for a module
   */
  async deleteByModule(moduleId) {
    return knex('module_attachments')
      .where('module_id', moduleId)
      .del();
  }

  /**
   * Count attachments by module
   */
  async countByModule(moduleId) {
    const [{ count }] = await knex('module_attachments')
      .where('module_id', moduleId)
      .count('* as count');
    
    return parseInt(count);
  }

  /**
   * Get attachment statistics for a module
   */
  async getStatistics(moduleId) {
    const stats = await knex('module_attachments')
      .where('module_id', moduleId)
      .select(
        knex.raw('COUNT(*) as total_attachments'),
        knex.raw('COUNT(*) FILTER (WHERE is_downloadable = true) as downloadable_attachments'),
        knex.raw('SUM(file_size) as total_size_bytes')
      )
      .first();

    return {
      total_attachments: parseInt(stats.total_attachments) || 0,
      downloadable_attachments: parseInt(stats.downloadable_attachments) || 0,
      total_size_bytes: parseInt(stats.total_size_bytes) || 0,
      total_size_mb: ((parseInt(stats.total_size_bytes) || 0) / (1024 * 1024)).toFixed(2)
    };
  }

  /**
   * Get lesson statistics (all modules in a lesson)
   */
  async getLessonStatistics(lessonId) {
    const stats = await knex('module_attachments')
      .join('lesson_modules', 'module_attachments.module_id', 'lesson_modules.id')
      .where('lesson_modules.lesson_id', lessonId)
      .select(
        knex.raw('COUNT(*) as total_attachments'),
        knex.raw('COUNT(*) FILTER (WHERE module_attachments.is_downloadable = true) as downloadable_attachments'),
        knex.raw('SUM(module_attachments.file_size) as total_size_bytes'),
        knex.raw('COUNT(DISTINCT module_attachments.module_id) as modules_with_attachments')
      )
      .first();

    return {
      total_attachments: parseInt(stats.total_attachments) || 0,
      downloadable_attachments: parseInt(stats.downloadable_attachments) || 0,
      total_size_bytes: parseInt(stats.total_size_bytes) || 0,
      total_size_mb: ((parseInt(stats.total_size_bytes) || 0) / (1024 * 1024)).toFixed(2),
      modules_with_attachments: parseInt(stats.modules_with_attachments) || 0
    };
  }

  /**
   * Get next order index for a module
   */
  async getNextOrderIndex(moduleId) {
    const result = await knex('module_attachments')
      .where('module_id', moduleId)
      .max('order_index as max_order');
    
    return (result[0].max_order || -1) + 1;
  }

  /**
   * Find attachments by file type
   */
  async findByFileType(moduleId, fileType) {
    return knex('module_attachments')
      .where({ module_id: moduleId, file_type: fileType })
      .orderBy('order_index', 'asc');
  }

  /**
   * Toggle downloadable status
   */
  async toggleDownloadable(id, isDownloadable) {
    return this.update(id, { is_downloadable: isDownloadable });
  }
}

module.exports = new ModuleAttachmentRepository();
