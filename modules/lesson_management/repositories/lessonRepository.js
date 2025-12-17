/**
 * Lesson Repository
 * Handles all database operations for lessons using Knex
 */

const knex = require('../../../config/knex');

class LessonRepository {
  /**
   * Get all lessons for a course with pagination
   */
  async findByCourse(courseId, options = {}) {
    const { page = 1, limit = 50, includeUnpublished = false } = options;
    const offset = (page - 1) * limit;

    // Build base query for counting
    let countQuery = knex('lessons')
      .where('course_id', courseId);

    if (!includeUnpublished) {
      countQuery = countQuery.where('is_published', true);
    }

    // Get total count
    const total = await countQuery.count('* as count').first();

    // Build query for fetching lessons
    let query = knex('lessons')
      .select('lessons.*')
      .where('course_id', courseId)
      .orderBy('display_order', 'asc');

    if (!includeUnpublished) {
      query = query.where('is_published', true);
    }

    const lessons = await query.limit(limit).offset(offset);

    return {
      lessons,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.count),
        pages: Math.ceil(parseInt(total.count) / limit)
      }
    };
  }

  /**
   * Find lesson by ID
   */
  async findById(id) {
    return await knex('lessons')
      .select('lessons.*')
      .where('lessons.id', id)
      .first();
  }

  /**
   * Find lesson by ID with course details
   */
  async findByIdWithCourse(id) {
    return await knex('lessons')
      .select(
        'lessons.*',
        'courses.title as course_title',
        'courses.instructor_id',
        'courses.is_published as course_is_published'
      )
      .leftJoin('courses', 'lessons.course_id', 'courses.id')
      .where('lessons.id', id)
      .first();
  }

  /**
   * Find lesson by course ID and slug
   */
  async findBySlug(courseId, slug) {
    return await knex('lessons')
      .where({ course_id: courseId, slug })
      .first();
  }

  /**
   * Create a new lesson
   */
  async create(lessonData) {
    const {
      course_id,
      title,
      slug,
      description,
      display_order,
      is_published = false,
      metadata
    } = lessonData;

    // Get the next display order if not provided
    let finalDisplayOrder = display_order;
    if (finalDisplayOrder === undefined || finalDisplayOrder === null) {
      const maxOrder = await knex('lessons')
        .where('course_id', course_id)
        .max('display_order as max')
        .first();
      finalDisplayOrder = (maxOrder.max || 0) + 1;
    }

    const [lesson] = await knex('lessons')
      .insert({
        course_id,
        title,
        slug,
        description,
        display_order: finalDisplayOrder,
        is_published,
        metadata: metadata ? JSON.stringify(metadata) : null,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      })
      .returning('*');

    return lesson;
  }

  /**
   * Update lesson
   */
  async update(id, lessonData) {
    console.log('Updating lesson ID:', id, 'with data:', lessonData);
    const updateData = { ...lessonData };
    
    // Convert objects to JSON strings if present
    if (updateData.content_data && typeof updateData.content_data === 'object') {
      updateData.content_data = JSON.stringify(updateData.content_data);
    }
    if (updateData.metadata && typeof updateData.metadata === 'object') {
      updateData.metadata = JSON.stringify(updateData.metadata);
    }

    const [lesson] = await knex('lessons')
      .where({ id })
      .update({
        ...updateData,
        updated_at: knex.fn.now()
      })
      .returning('*');

    return lesson;
  }

  /**
   * Update lesson status (publish/unpublish)
   */
  async updateStatus(id, isPublished) {
    const [lesson] = await knex('lessons')
      .where({ id })
      .update({
        is_published: isPublished,
        updated_at: knex.fn.now()
      })
      .returning('*');

    return lesson;
  }

  /**
   * Reorder lessons in a course
   */
  async reorder(courseId, lessonOrders) {
    // lessonOrders should be an array of { id, display_order }
    const trx = await knex.transaction();

    try {
      for (const { id, display_order } of lessonOrders) {
        await trx('lessons')
          .where({ id, course_id: courseId })
          .update({
            display_order,
            updated_at: knex.fn.now()
          });
      }

      await trx.commit();
      return true;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  /**
   * Delete lesson
   */
  async delete(id) {
    await knex('lessons')
      .where({ id })
      .delete();
  }

  /**
   * Get lesson count for a course
   */
  async countByCourse(courseId, options = {}) {
    const { includeUnpublished = false } = options;

    let query = knex('lessons')
      .where('course_id', courseId)
      .count('* as count');

    if (!includeUnpublished) {
      query = query.where('is_published', true);
    }

    const result = await query.first();
    return parseInt(result.count);
  }

  /**
   * Get total duration for a course
   */
  async getTotalDuration(courseId) {
    const result = await knex('lessons')
      .where({ course_id: courseId, is_published: true })
      .sum('duration_minutes as total')
      .first();

    return parseInt(result.total) || 0;
  }

  /**
   * Get lessons by content type
   */
  async findByContentType(courseId, contentType) {
    return await knex('lessons')
      .where({ course_id: courseId, content_type: contentType })
      .orderBy('display_order', 'asc');
  }

  /**
   * Get preview lessons for a course
   */
  async findPreviewLessons(courseId) {
    return await knex('lessons')
      .where({
        course_id: courseId,
        is_preview: true,
        is_published: true
      })
      .orderBy('display_order', 'asc');
  }

  /**
   * Get next lesson in sequence
   */
  async findNextLesson(courseId, currentDisplayOrder) {
    return await knex('lessons')
      .where('course_id', courseId)
      .where('display_order', '>', currentDisplayOrder)
      .where('is_published', true)
      .orderBy('display_order', 'asc')
      .first();
  }

  /**
   * Get previous lesson in sequence
   */
  async findPreviousLesson(courseId, currentDisplayOrder) {
    return await knex('lessons')
      .where('course_id', courseId)
      .where('display_order', '<', currentDisplayOrder)
      .where('is_published', true)
      .orderBy('display_order', 'desc')
      .first();
  }

  /**
   * Search lessons within a course
   */
  async search(courseId, searchQuery, options = {}) {
    const { page = 1, limit = 20, includeUnpublished = false } = options;
    const offset = (page - 1) * limit;

    let query = knex('lessons')
      .where('course_id', courseId)
      .where(function() {
        this.where('title', 'ilike', `%${searchQuery}%`)
          .orWhere('description', 'ilike', `%${searchQuery}%`)
          .orWhere('transcript', 'ilike', `%${searchQuery}%`);
      });

    if (!includeUnpublished) {
      query = query.where('is_published', true);
    }

    const total = await query.clone().count('* as count').first();
    const lessons = await query
      .limit(limit)
      .offset(offset)
      .orderBy('display_order', 'asc');

    return {
      lessons,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.count),
        pages: Math.ceil(parseInt(total.count) / limit)
      }
    };
  }

  /**
   * Get lesson statistics
   */
  async getStatistics(lessonId) {
    const completions = await knex('lesson_progress')
      .where({ lesson_id: lessonId, is_completed: true })
      .count('* as count')
      .first();

    const avgWatchTime = await knex('lesson_progress')
      .where({ lesson_id: lessonId })
      .avg('watch_time_seconds as avg')
      .first();

    const totalViews = await knex('lesson_progress')
      .where({ lesson_id: lessonId })
      .count('* as count')
      .first();

    return {
      completions: parseInt(completions.count),
      totalViews: parseInt(totalViews.count),
      avgWatchTime: parseFloat(avgWatchTime.avg) || 0
    };
  }

  /**
   * Bulk update lessons
   */
  async bulkUpdate(courseId, updates) {
    // updates should be an array of { id, ...updateData }
    const trx = await knex.transaction();

    try {
      const results = [];
      for (const update of updates) {
        const { id, ...updateData } = update;
        const [lesson] = await trx('lessons')
          .where({ id, course_id: courseId })
          .update({
            ...updateData,
            updated_at: knex.fn.now()
          })
          .returning('*');
        results.push(lesson);
      }

      await trx.commit();
      return results;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  /**
   * Duplicate lesson
   */
  async duplicate(lessonId, newTitle = null) {
    const lesson = await this.findById(lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Get the next display order
    const maxOrder = await knex('lessons')
      .where('course_id', lesson.course_id)
      .max('display_order as max')
      .first();

    const newLesson = {
      ...lesson,
      id: undefined,
      title: newTitle || `${lesson.title} (Copy)`,
      slug: `${lesson.slug}-copy-${Date.now()}`,
      display_order: (maxOrder.max || 0) + 1,
      is_published: false,
      created_at: undefined,
      updated_at: undefined
    };

    return await this.create(newLesson);
  }

  /**
   * Get lessons with progress for a user
   */
  async findWithProgress(courseId, userId, options = {}) {
    const { includeUnpublished = false } = options;

    let query = knex('lessons')
      .select(
        'lessons.*',
        'lesson_progress.is_completed',
        'lesson_progress.started_at',
        'lesson_progress.completed_at',
        'lesson_progress.last_position',
        'lesson_progress.watch_time_seconds'
      )
      .leftJoin('lesson_progress', function() {
        this.on('lessons.id', '=', 'lesson_progress.lesson_id')
          .andOn('lesson_progress.user_id', '=', knex.raw('?', [userId]));
      })
      .where('lessons.course_id', courseId)
      .orderBy('lessons.display_order', 'asc');

    if (!includeUnpublished) {
      query = query.where('lessons.is_published', true);
    }

    return await query;
  }

  /**
   * Check if slug exists for course
   */
  async slugExists(courseId, slug, excludeId = null) {
    let query = knex('lessons')
      .where({ course_id: courseId, slug })
      .count('* as count');

    if (excludeId) {
      query = query.whereNot('id', excludeId);
    }

    const result = await query.first();
    return parseInt(result.count) > 0;
  }
}

module.exports = new LessonRepository();
