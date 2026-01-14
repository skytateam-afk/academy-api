/**
 * Feedback Repository
 * Handles database operations for chat feedback
 */

const knex = require('../../../config/knex');

class FeedbackRepository {
  /**
   * Get all feedback with pagination and filters
   */
  async findAll(options = {}) {
    const { page = 1, limit = 20, feedbackType, rating, startDate, endDate, search } = options;
    const offset = (page - 1) * limit;

    // Build base query for filtering (without select)
    let baseQuery = knex('chat_feedback');

    if (feedbackType) {
      baseQuery = baseQuery.where('chat_feedback.feedback_type', feedbackType);
    }

    if (rating) {
      baseQuery = baseQuery.where('chat_feedback.rating', rating);
    }

    if (search) {
      baseQuery = baseQuery.where(function() {
        this.where('chat_feedback.email', 'ilike', `%${search}%`)
          .orWhere('chat_feedback.comment', 'ilike', `%${search}%`)
          .orWhere('chat_feedback.session_id', 'ilike', `%${search}%`);
      });
    }

    if (startDate) {
      baseQuery = baseQuery.where('chat_feedback.created_at', '>=', startDate);
    }

    if (endDate) {
      baseQuery = baseQuery.where('chat_feedback.created_at', '<=', endDate);
    }

    // Get total count
    const totalResult = await baseQuery.clone().count('* as count').first();
    const total = parseInt(totalResult.count) || 0;

    // Get paginated feedbacks
    const feedbacks = await baseQuery
      .clone()
      .select('chat_feedback.*')
      .orderBy('chat_feedback.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      feedbacks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find feedback by ID
   */
  async findById(id) {
    return await knex('chat_feedback')
      .where('id', id)
      .first();
  }

  /**
   * Delete feedback by ID
   */
  async deleteById(id) {
    return await knex('chat_feedback')
      .where('id', id)
      .del();
  }

  /**
   * Get feedback analytics
   */
  async getAnalytics(options = {}) {
    const { startDate, endDate } = options;
    
    let query = knex('chat_feedback');

    if (startDate) {
      query = query.where('created_at', '>=', startDate);
    }
    if (endDate) {
      query = query.where('created_at', '<=', endDate);
    }

    const [
      totalFeedback,
      thumbsUp,
      thumbsDown,
      avgRating,
      feedbackByType
    ] = await Promise.all([
      query.clone().count('* as count').first(),
      query.clone().where('feedback_type', 'thumbs_up').count('* as count').first(),
      query.clone().where('feedback_type', 'thumbs_down').count('* as count').first(),
      query.clone().whereNotNull('rating').avg('rating as avg').first(),
      query.clone()
        .select('feedback_type')
        .count('* as count')
        .groupBy('feedback_type')
    ]);

    const thumbsUpCount = parseInt(thumbsUp.count) || 0;
    const thumbsDownCount = parseInt(thumbsDown.count) || 0;
    const totalCount = parseInt(totalFeedback.count) || 0;

    return {
      total_feedback: totalCount,
      thumbs_up: thumbsUpCount,
      thumbs_down: thumbsDownCount,
      satisfaction_rate: totalCount > 0 ? ((thumbsUpCount / totalCount) * 100).toFixed(2) : 0,
      average_rating: avgRating.avg ? parseFloat(avgRating.avg).toFixed(2) : null,
      feedback_by_type: feedbackByType.reduce((acc, item) => {
        acc[item.feedback_type] = parseInt(item.count);
        return acc;
      }, {})
    };
  }
}

module.exports = new FeedbackRepository();
