/**
 * Attachment Repository
 * Handles all database operations for lesson attachments using Knex
 */

const knex = require('../../../config/knex');

class AttachmentRepository {
  /**
   * Get all attachments for a lesson
   */
  async findByLesson(lessonId) {
    return await knex('lesson_attachments')
      .where('lesson_id', lessonId)
      .orderBy('display_order', 'asc');
  }

  /**
   * Find attachment by ID
   */
  async findById(id) {
    return await knex('lesson_attachments')
      .where('id', id)
      .first();
  }

  /**
   * Find attachment by ID with lesson details
   */
  async findByIdWithLesson(id) {
    return await knex('lesson_attachments')
      .select(
        'lesson_attachments.*',
        'lessons.title as lesson_title',
        'lessons.course_id'
      )
      .leftJoin('lessons', 'lesson_attachments.lesson_id', 'lessons.id')
      .where('lesson_attachments.id', id)
      .first();
  }

  /**
   * Create a new attachment
   */
  async create(attachmentData) {
    const {
      lesson_id,
      title,
      file_url,
      file_type,
      file_size,
      display_order,
      is_downloadable = true
    } = attachmentData;

    // Get the next display order if not provided
    let finalDisplayOrder = display_order;
    if (finalDisplayOrder === undefined || finalDisplayOrder === null) {
      const maxOrder = await knex('lesson_attachments')
        .where('lesson_id', lesson_id)
        .max('display_order as max')
        .first();
      finalDisplayOrder = (maxOrder.max || 0) + 1;
    }

    const [attachment] = await knex('lesson_attachments')
      .insert({
        lesson_id,
        title,
        file_url,
        file_type,
        file_size,
        display_order: finalDisplayOrder,
        is_downloadable,
        created_at: knex.fn.now()
      })
      .returning('*');

    return attachment;
  }

  /**
   * Update attachment
   */
  async update(id, attachmentData) {
    const [attachment] = await knex('lesson_attachments')
      .where({ id })
      .update(attachmentData)
      .returning('*');

    return attachment;
  }

  /**
   * Reorder attachments for a lesson
   */
  async reorder(lessonId, attachmentOrders) {
    // attachmentOrders should be an array of { id, display_order }
    const trx = await knex.transaction();

    try {
      for (const { id, display_order } of attachmentOrders) {
        await trx('lesson_attachments')
          .where({ id, lesson_id: lessonId })
          .update({ display_order });
      }

      await trx.commit();
      return true;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  /**
   * Delete attachment
   */
  async delete(id) {
    await knex('lesson_attachments')
      .where({ id })
      .delete();
  }

  /**
   * Get attachment count for a lesson
   */
  async countByLesson(lessonId) {
    const result = await knex('lesson_attachments')
      .where('lesson_id', lessonId)
      .count('* as count')
      .first();

    return parseInt(result.count);
  }

  /**
   * Get total file size for a lesson
   */
  async getTotalFileSize(lessonId) {
    const result = await knex('lesson_attachments')
      .where('lesson_id', lessonId)
      .sum('file_size as total')
      .first();

    return parseInt(result.total) || 0;
  }

  /**
   * Get attachments by file type
   */
  async findByFileType(lessonId, fileType) {
    return await knex('lesson_attachments')
      .where({ lesson_id: lessonId, file_type: fileType })
      .orderBy('display_order', 'asc');
  }

  /**
   * Get downloadable attachments
   */
  async findDownloadable(lessonId) {
    return await knex('lesson_attachments')
      .where({ lesson_id: lessonId, is_downloadable: true })
      .orderBy('display_order', 'asc');
  }

  /**
   * Bulk create attachments
   */
  async bulkCreate(lessonId, attachments) {
    // attachments should be an array of attachment data
    const trx = await knex.transaction();

    try {
      // Get the current max display order
      const maxOrder = await trx('lesson_attachments')
        .where('lesson_id', lessonId)
        .max('display_order as max')
        .first();

      let currentOrder = (maxOrder.max || 0) + 1;

      const results = [];
      for (const attachment of attachments) {
        const [created] = await trx('lesson_attachments')
          .insert({
            lesson_id: lessonId,
            title: attachment.title,
            file_url: attachment.file_url,
            file_type: attachment.file_type,
            file_size: attachment.file_size,
            display_order: attachment.display_order || currentOrder++,
            is_downloadable: attachment.is_downloadable !== undefined ? attachment.is_downloadable : true,
            created_at: knex.fn.now()
          })
          .returning('*');
        results.push(created);
      }

      await trx.commit();
      return results;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  /**
   * Delete all attachments for a lesson
   */
  async deleteByLesson(lessonId) {
    await knex('lesson_attachments')
      .where('lesson_id', lessonId)
      .delete();
  }

  /**
   * Get attachments for multiple lessons
   */
  async findByLessons(lessonIds) {
    return await knex('lesson_attachments')
      .whereIn('lesson_id', lessonIds)
      .orderBy('lesson_id', 'asc')
      .orderBy('display_order', 'asc');
  }

  /**
   * Get attachment statistics for a course
   */
  async getCourseStatistics(courseId) {
    const result = await knex('lesson_attachments')
      .select(
        knex.raw('COUNT(*) as total_attachments'),
        knex.raw('SUM(file_size) as total_size'),
        knex.raw('COUNT(DISTINCT lesson_id) as lessons_with_attachments')
      )
      .join('lessons', 'lesson_attachments.lesson_id', 'lessons.id')
      .where('lessons.course_id', courseId)
      .first();

    return {
      totalAttachments: parseInt(result.total_attachments) || 0,
      totalSize: parseInt(result.total_size) || 0,
      lessonsWithAttachments: parseInt(result.lessons_with_attachments) || 0
    };
  }

  /**
   * Search attachments by title
   */
  async search(lessonId, searchQuery) {
    return await knex('lesson_attachments')
      .where('lesson_id', lessonId)
      .where('title', 'ilike', `%${searchQuery}%`)
      .orderBy('display_order', 'asc');
  }

  /**
   * Update attachment downloadable status
   */
  async updateDownloadableStatus(id, isDownloadable) {
    const [attachment] = await knex('lesson_attachments')
      .where({ id })
      .update({ is_downloadable: isDownloadable })
      .returning('*');

    return attachment;
  }

  /**
   * Get attachments with file size greater than specified
   */
  async findLargeFiles(lessonId, minSize) {
    return await knex('lesson_attachments')
      .where('lesson_id', lessonId)
      .where('file_size', '>', minSize)
      .orderBy('file_size', 'desc');
  }

  /**
   * Duplicate attachments from one lesson to another
   */
  async duplicateToLesson(sourceLessonId, targetLessonId) {
    const sourceAttachments = await this.findByLesson(sourceLessonId);
    
    if (sourceAttachments.length === 0) {
      return [];
    }

    const trx = await knex.transaction();

    try {
      const results = [];
      for (const attachment of sourceAttachments) {
        const [created] = await trx('lesson_attachments')
          .insert({
            lesson_id: targetLessonId,
            title: attachment.title,
            file_url: attachment.file_url,
            file_type: attachment.file_type,
            file_size: attachment.file_size,
            display_order: attachment.display_order,
            is_downloadable: attachment.is_downloadable,
            created_at: knex.fn.now()
          })
          .returning('*');
        results.push(created);
      }

      await trx.commit();
      return results;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }
}

module.exports = new AttachmentRepository();
