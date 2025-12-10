const Announcement = require('../../../models/Announcement')
const User = require('../../../models/User')
const notificationService = require('../../notifications/services/notificationService')
const logger = require('../../../config/winston')

/**
 * Get all announcements (Admin)
 */
exports.getAllAnnouncements = async (req, res) => {
  try {
    const result = await Announcement.getAll(req.query)
    res.json(result)
  } catch (error) {
    console.error('Error getting announcements:', error)
    res.status(500).json({ message: error.message })
  }
}

/**
 * Get active announcements for current user
 */
exports.getActiveAnnouncements = async (req, res) => {
  try {
    const userId = req.user.userId
    const userRole = req.user.role_name || req.user.role

    console.log('[Announcements API] Fetching active announcements for user:', userId, 'role:', userRole)
    
    const announcements = await Announcement.getActiveForUser(userId, userRole)
    
    console.log('[Announcements API] Found', announcements.length, 'announcements')
    if (announcements.length > 0) {
      console.log('[Announcements API] Sample announcement:', {
        id: announcements[0].id,
        title: announcements[0].title,
        target_audience: announcements[0].target_audience,
        is_active: announcements[0].is_active,
        start_date: announcements[0].start_date,
        end_date: announcements[0].end_date
      })
    }
    
    res.json({ data: announcements })
  } catch (error) {
    console.error('[Announcements API] Error getting active announcements:', error)
    res.status(500).json({ message: error.message })
  }
}

/**
 * Get announcement by ID
 */
exports.getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params
    const announcement = await Announcement.findById(id)

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' })
    }

    res.json({ data: announcement })
  } catch (error) {
    console.error('Error getting announcement:', error)
    res.status(500).json({ message: error.message })
  }
}

/**
 * Create announcement
 */
exports.createAnnouncement = async (req, res) => {
  try {
    const data = {
      ...req.body,
      created_by: req.user.userId
    }

    const announcement = await Announcement.create(data)

    // Send batch notifications to targeted users (don't block response)
    if (announcement.is_active) {
      const targetAudience = announcement.target_audience || 'all'

      // Safely parse target_roles
      let targetRoles = []
      try {
        if (announcement.target_roles) {
          targetRoles = typeof announcement.target_roles === 'string'
            ? JSON.parse(announcement.target_roles)
            : announcement.target_roles
        }
      } catch (parseError) {
        logger.warn('Failed to parse target_roles', { error: parseError.message })
      }

      // Determine which users should receive notification
      let userFilters = { is_active: true }

      if (targetAudience === 'role' && Array.isArray(targetRoles) && targetRoles.length > 0) {
        userFilters.role = targetRoles
      }

      // Fetch users and send batch notifications (non-blocking)
      notificationService.sendBatchAnnouncementNotification(announcement.title, announcement.id, userFilters)
        .catch(err => logger.error('Failed to send announcement notifications', { error: err.message }))
    }

    res.status(201).json({
      message: 'Announcement created successfully',
      data: announcement
    })
  } catch (error) {
    console.error('Error creating announcement:', error)
    res.status(500).json({ message: error.message })
  }
}

/**
 * Update announcement
 */
exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params
    const announcement = await Announcement.update(id, req.body)

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' })
    }

    res.json({
      message: 'Announcement updated successfully',
      data: announcement
    })
  } catch (error) {
    console.error('Error updating announcement:', error)
    res.status(500).json({ message: error.message })
  }
}

/**
 * Delete announcement
 */
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params
    await Announcement.delete(id)

    res.json({ message: 'Announcement deleted successfully' })
  } catch (error) {
    console.error('Error deleting announcement:', error)
    res.status(500).json({ message: error.message })
  }
}

/**
 * Mark announcement as viewed
 */
exports.markAsViewed = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    await Announcement.markAsViewed(id, userId)
    res.json({ message: 'Announcement marked as viewed' })
  } catch (error) {
    console.error('Error marking announcement as viewed:', error)
    res.status(500).json({ message: error.message })
  }
}

/**
 * Dismiss announcement
 */
exports.dismissAnnouncement = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    await Announcement.dismiss(id, userId)
    res.json({ message: 'Announcement dismissed' })
  } catch (error) {
    console.error('Error dismissing announcement:', error)
    res.status(500).json({ message: error.message })
  }
}

/**
 * Get announcement statistics
 */
exports.getAnnouncementStats = async (req, res) => {
  try {
    const { id } = req.params
    const stats = await Announcement.getStatistics(id)

    res.json({ data: stats })
  } catch (error) {
    console.error('Error getting announcement stats:', error)
    res.status(500).json({ message: error.message })
  }
}
