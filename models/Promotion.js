const knex = require('../config/knex')

class Promotion {
  static get tableName() {
    return 'promotions'
  }

  /**
   * Get all promotions with pagination and filtering
   */
  static async getAll({ page = 1, limit = 10, is_active, display_type, target_audience, search } = {}) {
    const offset = (page - 1) * limit
    
    let query = knex(this.tableName)
      .leftJoin('users', 'promotions.created_by', 'users.id')
      .select(
        'promotions.*',
        knex.raw('CONCAT(users.first_name, \' \', users.last_name) as creator_name')
      )
    
    // Apply filters
    if (is_active !== undefined) {
      query = query.where('promotions.is_active', is_active)
    }
    
    if (display_type) {
      query = query.where('promotions.display_type', display_type)
    }
    
    if (target_audience) {
      query = query.where('promotions.target_audience', target_audience)
    }
    
    if (search) {
      query = query.where(function() {
        this.where('promotions.title', 'ilike', `%${search}%`)
          .orWhere('promotions.content', 'ilike', `%${search}%`)
      })
    }
    
    // Get total count
    const countQuery = query.clone().clearSelect().clearOrder().count('* as total')
    const [{ total }] = await countQuery
    
    // Get paginated results
    const promotions = await query
      .orderBy('promotions.priority', 'desc')
      .orderBy('promotions.created_at', 'desc')
      .limit(limit)
      .offset(offset)
    
    // Add statistics for each promotion
    const promotionsWithStats = await Promise.all(promotions.map(async (promotion) => {
      const [stats] = await knex('promotion_displays')
        .where('promotion_id', promotion.id)
        .select(
          knex.raw('COUNT(*) as total_displays'),
          knex.raw('COUNT(DISTINCT user_id) as unique_users'),
          knex.raw('COUNT(CASE WHEN was_clicked = true THEN 1 END) as total_clicks'),
          knex.raw('COUNT(CASE WHEN was_dismissed = true THEN 1 END) as total_dismissals')
        )
      
      // Calculate CTR
      let ctr = 0
      if (stats && parseInt(stats.total_displays) > 0) {
        ctr = (parseInt(stats.total_clicks) / parseInt(stats.total_displays)) * 100
      }
      
      return {
        ...promotion,
        total_displays: stats ? parseInt(stats.total_displays) : 0,
        total_clicks: stats ? parseInt(stats.total_clicks) : 0,
        total_dismissals: stats ? parseInt(stats.total_dismissals) : 0,
        unique_users: stats ? parseInt(stats.unique_users) : 0,
        ctr: ctr
      }
    }))
    
    return {
      data: promotionsWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Get banner promotions for a user (always show, ignore frequency/max displays, but respect dismissals)
   */
  static async getBannerPromotions(userId, userRole, isNewUser = false) {
    const now = new Date()
    
    // Get dismissed promotion IDs for this user
    const dismissedPromotions = await knex('promotion_displays')
      .select('promotion_id')
      .where('user_id', userId)
      .where('was_dismissed', true)
      .pluck('promotion_id')
    
    // Get active banner promotions
    let query = knex(this.tableName)
      .select('promotions.*')
      .where('promotions.is_active', true)
      .where('promotions.display_type', 'banner')
      .where(function() {
        // Either no start_date (immediate) or start_date is in the past
        this.whereNull('promotions.start_date')
          .orWhere('promotions.start_date', '<=', now)
      })
      .where(function() {
        // Either no end_date (ongoing) or end_date is in the future
        this.whereNull('promotions.end_date')
          .orWhere('promotions.end_date', '>=', now)
      })
      .where(function() {
        this.where('promotions.target_audience', 'all')
          .orWhere('promotions.target_audience', userRole)
      })
    
    // Exclude dismissed promotions
    if (dismissedPromotions.length > 0) {
      query = query.whereNotIn('promotions.id', dismissedPromotions)
    }
    
    // Add new_users targeting
    if (isNewUser) {
      query = query.orWhere('promotions.target_audience', 'new_users')
    }
    
    const promotions = await query
      .orderBy('promotions.priority', 'desc')
      .orderBy('promotions.created_at', 'desc')
    
    // Return all banner promotions (except dismissed ones)
    return promotions
  }

  /**
   * Get active promotions for a user
   */
  static async getActiveForUser(userId, userRole, isNewUser = false) {
    const now = new Date()
    
    // Get dismissed promotion IDs for this user
    const dismissedPromotions = await knex('promotion_displays')
      .select('promotion_id')
      .where('user_id', userId)
      .where('was_dismissed', true)
      .pluck('promotion_id')
    
    // Get user's display history
    const displayHistory = await knex('promotion_displays')
      .select('promotion_id')
      .count('* as display_count')
      .max('displayed_at as last_displayed')
      .where('user_id', userId)
      .groupBy('promotion_id')
    
    const displayMap = {}
    displayHistory.forEach(record => {
      displayMap[record.promotion_id] = {
        count: parseInt(record.display_count),
        lastDisplayed: record.last_displayed
      }
    })
    
    // Get active promotions
    let query = knex(this.tableName)
      .select('promotions.*')
      .where('promotions.is_active', true)
      .where(function() {
        // Either no start_date (immediate) or start_date is in the past
        this.whereNull('promotions.start_date')
          .orWhere('promotions.start_date', '<=', now)
      })
      .where(function() {
        // Either no end_date (ongoing) or end_date is in the future
        this.whereNull('promotions.end_date')
          .orWhere('promotions.end_date', '>=', now)
      })
      .where(function() {
        this.where('promotions.target_audience', 'all')
          .orWhere('promotions.target_audience', userRole)
      })
    
    // Exclude dismissed promotions
    if (dismissedPromotions.length > 0) {
      query = query.whereNotIn('promotions.id', dismissedPromotions)
    }
    
    // Add new_users targeting
    if (isNewUser) {
      query = query.orWhere('promotions.target_audience', 'new_users')
    }
    
    const promotions = await query
      .orderBy('promotions.priority', 'desc')
      .orderBy('promotions.created_at', 'desc')
    
    // Filter based on display frequency and max displays
    const eligiblePromotions = promotions.filter(promotion => {
      const history = displayMap[promotion.id]
      
      if (!history) {
        // Never shown before
        return true
      }
      
      // Check max displays
      if (history.count >= promotion.max_displays_per_user) {
        return false
      }
      
      // Check display frequency
      const hoursSinceLastDisplay = (now - new Date(history.lastDisplayed)) / (1000 * 60 * 60)
      if (hoursSinceLastDisplay < promotion.display_frequency_hours) {
        return false
      }
      
      return true
    })
    
    return eligiblePromotions
  }

  /**
   * Get promotion by ID
   */
  static async findById(id) {
    const promotion = await knex(this.tableName)
      .leftJoin('users', 'promotions.created_by', 'users.id')
      .select(
        'promotions.*',
        knex.raw('CONCAT(users.first_name, \' \', users.last_name) as creator_name')
      )
      .where('promotions.id', id)
      .first()
    
    if (promotion) {
      // Get display statistics
      const [stats] = await knex('promotion_displays')
        .where('promotion_id', id)
        .select(
          knex.raw('COUNT(*) as total_displays'),
          knex.raw('COUNT(DISTINCT user_id) as unique_users'),
          knex.raw('COUNT(CASE WHEN was_clicked = true THEN 1 END) as total_clicks'),
          knex.raw('COUNT(CASE WHEN was_dismissed = true THEN 1 END) as total_dismissals')
        )
      
      promotion.stats = stats
      
      // Calculate CTR (Click-Through Rate)
      if (stats.total_displays > 0) {
        promotion.stats.ctr = ((stats.total_clicks / stats.total_displays) * 100).toFixed(2)
      } else {
        promotion.stats.ctr = '0.00'
      }
    }
    
    return promotion
  }

  /**
   * Create new promotion
   */
  static async create(data) {
    const [promotion] = await knex(this.tableName)
      .insert(data)
      .returning('*')
    
    return promotion
  }

  /**
   * Update promotion
   */
  static async update(id, data) {
    const [promotion] = await knex(this.tableName)
      .where('id', id)
      .update({
        ...data,
        updated_at: knex.fn.now()
      })
      .returning('*')
    
    return promotion
  }

  /**
   * Delete promotion
   */
  static async delete(id) {
    return await knex(this.tableName)
      .where('id', id)
      .del()
  }

  /**
   * Record promotion display
   */
  static async recordDisplay(promotionId, userId) {
    const [display] = await knex('promotion_displays')
      .insert({
        promotion_id: promotionId,
        user_id: userId,
        displayed_at: knex.fn.now()
      })
      .returning('*')
    
    return display
  }

  /**
   * Record promotion click
   */
  static async recordClick(displayId) {
    return await knex('promotion_displays')
      .where('id', displayId)
      .update({
        was_clicked: true,
        clicked_at: knex.fn.now()
      })
  }

  /**
   * Record promotion dismissal
   */
  static async recordDismissal(displayId) {
    return await knex('promotion_displays')
      .where('id', displayId)
      .update({
        was_dismissed: true,
        dismissed_at: knex.fn.now()
      })
  }

  /**
   * Get promotion statistics
   */
  static async getStatistics(promotionId) {
    const [stats] = await knex('promotion_displays')
      .where('promotion_id', promotionId)
      .select(
        knex.raw('COUNT(*) as total_displays'),
        knex.raw('COUNT(DISTINCT user_id) as unique_users'),
        knex.raw('COUNT(CASE WHEN was_clicked = true THEN 1 END) as click_count'),
        knex.raw('COUNT(CASE WHEN was_dismissed = true THEN 1 END) as dismissal_count')
      )
    
    // Calculate metrics
    if (stats.total_displays > 0) {
      stats.ctr = ((stats.click_count / stats.total_displays) * 100).toFixed(2)
      stats.dismissal_rate = ((stats.dismissal_count / stats.total_displays) * 100).toFixed(2)
    } else {
      stats.ctr = '0.00'
      stats.dismissal_rate = '0.00'
    }
    
    return stats
  }

  /**
   * Get promotion performance over time
   */
  static async getPerformanceOverTime(promotionId, days = 7) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const performance = await knex('promotion_displays')
      .where('promotion_id', promotionId)
      .where('displayed_at', '>=', startDate)
      .select(
        knex.raw('DATE(displayed_at) as date'),
        knex.raw('COUNT(*) as displays'),
        knex.raw('COUNT(CASE WHEN was_clicked = true THEN 1 END) as clicks'),
        knex.raw('COUNT(CASE WHEN was_dismissed = true THEN 1 END) as dismissals')
      )
      .groupBy(knex.raw('DATE(displayed_at)'))
      .orderBy('date', 'asc')
    
    return performance
  }
}

module.exports = Promotion
