const knex = require('../config/knex')

class Announcement {
  static get tableName() {
    return 'announcements'
  }

  /**
   * Get all announcements with pagination and filtering
   */
  static async getAll({ page = 1, limit = 10, is_active, type, target_audience, search } = {}) {
    const offset = (page - 1) * limit
    
    // Build base query for filtering
    let baseQuery = knex(this.tableName)
    
    // Apply filters to base query
    if (is_active !== undefined) {
      baseQuery = baseQuery.where('announcements.is_active', is_active)
    }
    
    if (type) {
      baseQuery = baseQuery.where('announcements.type', type)
    }
    
    if (target_audience) {
      baseQuery = baseQuery.where('announcements.target_audience', target_audience)
    }
    
    if (search) {
      baseQuery = baseQuery.where(function() {
        this.where('announcements.title', 'ilike', `%${search}%`)
          .orWhere('announcements.content', 'ilike', `%${search}%`)
      })
    }
    
    // Get total count (without joins to avoid GROUP BY issues)
    const [{ count: total }] = await baseQuery.clone().count('* as count')
    
    // Get paginated results with joins and aggregations
    const announcements = await baseQuery.clone()
      .leftJoin('users', 'announcements.created_by', 'users.id')
      .leftJoin('announcement_views', 'announcements.id', 'announcement_views.announcement_id')
      .select(
        'announcements.*',
        knex.raw('CONCAT(users.first_name, \' \', users.last_name) as creator_name'),
        knex.raw('COUNT(announcement_views.id)::integer as views_count')
      )
      .groupBy('announcements.id', 'users.id')
      .orderBy('announcements.priority', 'desc')
      .orderBy('announcements.created_at', 'desc')
      .limit(limit)
      .offset(offset)
    
    return {
      data: announcements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        totalPages: Math.ceil(parseInt(total) / limit)
      }
    }
  }

  /**
   * Get active announcements for a user
   */
  static async getActiveForUser(userId, userRole) {
    const now = new Date()
    
    console.log('[Announcement Model] Getting active announcements for userId:', userId, 'userRole:', userRole)
    console.log('[Announcement Model] Current time:', now)
    
    // Map role names to target_audience values (singular to plural)
    const roleToAudienceMap = {
      'student': 'students',
      'instructor': 'instructors',
      'admin': 'admins',
      'super_admin': 'admins'
    }
    
    const targetAudience = roleToAudienceMap[userRole] || userRole
    console.log('[Announcement Model] Mapped target audience:', targetAudience)
    
    const query = knex(this.tableName)
      .leftJoin('announcement_views', function() {
        this.on('announcements.id', '=', 'announcement_views.announcement_id')
          .andOnVal('announcement_views.user_id', '=', userId)
      })
      .leftJoin('users', 'announcements.created_by', 'users.id')
      .select(
        'announcements.*',
        'announcement_views.is_dismissed',
        'announcement_views.viewed_at',
        knex.raw('CONCAT(users.first_name, \' \', users.last_name) as creator_name')
      )
      .where('announcements.is_active', true)
      .where(function() {
        this.where('announcements.start_date', '<=', now)
          .orWhereNull('announcements.start_date')
      })
      .where(function() {
        this.where('announcements.end_date', '>=', now)
          .orWhereNull('announcements.end_date')
      })
      .where(function() {
        this.where('announcements.target_audience', 'all')
          .orWhere('announcements.target_audience', targetAudience)
          .orWhere('announcements.target_audience', userRole) // Also check original role in case it matches
      })
      .where(function() {
        // Only show if not dismissed or not dismissible
        this.whereNull('announcement_views.is_dismissed')
          .orWhere('announcement_views.is_dismissed', false)
          .orWhere('announcements.is_dismissible', false)
      })
      .orderBy('announcements.priority', 'desc')
      .orderBy('announcements.created_at', 'desc')
    
    console.log('[Announcement Model] Query SQL:', query.toSQL().sql)
    
    const announcements = await query
    
    console.log('[Announcement Model] Query returned', announcements.length, 'announcements')
    if (announcements.length > 0) {
      console.log('[Announcement Model] First announcement:', {
        id: announcements[0].id,
        title: announcements[0].title,
        target_audience: announcements[0].target_audience,
        is_dismissed: announcements[0].is_dismissed
      })
    }
    
    return announcements
  }

  /**
   * Get announcement by ID
   */
  static async findById(id) {
    const announcement = await knex(this.tableName)
      .leftJoin('users', 'announcements.created_by', 'users.id')
      .select(
        'announcements.*',
        knex.raw('CONCAT(users.first_name, \' \', users.last_name) as creator_name')
      )
      .where('announcements.id', id)
      .first()
    
    if (announcement) {
      // Get view statistics
      const [stats] = await knex('announcement_views')
        .where('announcement_id', id)
        .select(
          knex.raw('COUNT(*) as total_views'),
          knex.raw('COUNT(CASE WHEN is_dismissed = true THEN 1 END) as total_dismissed')
        )
      
      announcement.stats = stats
    }
    
    return announcement
  }

  /**
   * Create new announcement
   */
  static async create(data) {
    const [announcement] = await knex(this.tableName)
      .insert(data)
      .returning('*')
    
    return announcement
  }

  /**
   * Update announcement
   */
  static async update(id, data) {
    const [announcement] = await knex(this.tableName)
      .where('id', id)
      .update({
        ...data,
        updated_at: new Date()
      })
      .returning('*')
    
    return announcement
  }

  /**
   * Delete announcement
   */
  static async delete(id) {
    return await knex(this.tableName)
      .where('id', id)
      .del()
  }

  /**
   * Mark announcement as viewed by user
   */
  static async markAsViewed(announcementId, userId) {
    return await knex('announcement_views')
      .insert({
        announcement_id: announcementId,
        user_id: userId,
        viewed_at: new Date()
      })
      .onConflict(['announcement_id', 'user_id'])
      .ignore()
  }

  /**
   * Dismiss announcement for user
   */
  static async dismiss(announcementId, userId) {
    return await knex('announcement_views')
      .where({
        announcement_id: announcementId,
        user_id: userId
      })
      .update({
        is_dismissed: true,
        dismissed_at: new Date()
      })
  }

  /**
   * Get announcement statistics
   */
  static async getStatistics(announcementId) {
    // Get overall stats
    const [stats] = await knex('announcement_views')
      .where('announcement_id', announcementId)
      .select(
        knex.raw('COUNT(*) as total_views'),
        knex.raw('COUNT(CASE WHEN is_dismissed = true THEN 1 END) as total_dismissals')
      )
    
    // Calculate dismissal rate
    const totalViews = parseInt(stats.total_views) || 0
    const totalDismissals = parseInt(stats.total_dismissals) || 0
    const dismissalRate = totalViews > 0 ? (totalDismissals / totalViews) * 100 : 0
    
    // Get views by date for the last 30 days
    const viewsByDate = await knex('announcement_views')
      .where('announcement_id', announcementId)
      .select(
        knex.raw('DATE(viewed_at) as date'),
        knex.raw('COUNT(*) as count')
      )
      .groupBy(knex.raw('DATE(viewed_at)'))
      .orderBy('date', 'desc')
      .limit(30)
    
    return {
      total_views: totalViews,
      total_dismissals: totalDismissals,
      dismissal_rate: dismissalRate,
      views_by_date: viewsByDate
    }
  }
}

module.exports = Announcement
