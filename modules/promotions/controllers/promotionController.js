const Promotion = require('../../../models/Promotion')
const storageService = require('../../../services/storageService')
const notificationService = require('../../notifications/services/notificationService')
const logger = require('../../../config/winston')

/**
 * Upload promotion image
 */
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' })
    }

    // Upload to R2
    const uploadResult = await storageService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'promotions',
      { uploadedBy: req.user.userId }
    )

    res.json({
      message: 'Image uploaded successfully',
      data: {
        url: uploadResult.fileUrl,
        filename: uploadResult.filename,
        fileKey: uploadResult.fileKey
      }
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    res.status(500).json({ message: error.message })
  }
}

/**
 * Get all promotions (Admin)
 */
exports.getAllPromotions = async (req, res) => {
  try {
    const result = await Promotion.getAll(req.query)
    res.json(result)
  } catch (error) {
    console.error('Error getting promotions:', error)
    res.status(500).json({ message: error.message })
  }
}

/**
 * Get active promotions for current user
 */
exports.getActivePromotions = async (req, res) => {
  try {
    const userId = req.user.userId
    const userRole = req.user.role_name || req.user.role

    // Check if user is new (created within last 7 days)
    const userCreatedAt = new Date(req.user.created_at)
    const daysSinceCreation = (Date.now() - userCreatedAt) / (1000 * 60 * 60 * 24)
    const isNewUser = daysSinceCreation <= 7

    // Get banner promotions (always show, ignore frequency/max displays)
    const bannerPromotions = await Promotion.getBannerPromotions(userId, userRole, isNewUser)
    
    // Get popup/corner promotions (respect frequency/max displays)
    const otherPromotions = await Promotion.getActiveForUser(userId, userRole, isNewUser)
    
    // Filter out banners from otherPromotions (to avoid duplicates)
    const filteredOtherPromotions = otherPromotions.filter(p => p.display_type !== 'banner')
    
    // Combine both
    const allPromotions = [...bannerPromotions, ...filteredOtherPromotions]
    
    res.json({ data: allPromotions })
  } catch (error) {
    console.error('Error getting active promotions:', error)
    res.status(500).json({ message: error.message })
  }
}

/**
 * Get promotion by ID
 */
exports.getPromotionById = async (req, res) => {
  try {
    const { id } = req.params
    const promotion = await Promotion.findById(id)

    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' })
    }

    res.json({ data: promotion })
  } catch (error) {
    console.error('Error getting promotion:', error)
    res.status(500).json({ message: error.message })
  }
}

/**
 * Create promotion
 */
exports.createPromotion = async (req, res) => {
  try {
    const data = {
      ...req.body,
      created_by: req.user.userId
    }

    const promotion = await Promotion.create(data)

    // Send batch notifications to targeted users (don't block response)
    if (promotion.is_active) {
      const targetAudience = promotion.target_audience || 'all'
      const targetNewUsers = promotion.target_new_users

      // Safely parse target_roles
      let targetRoles = []
      try {
        if (promotion.target_roles) {
          targetRoles = typeof promotion.target_roles === 'string'
            ? JSON.parse(promotion.target_roles)
            : promotion.target_roles
        }
      } catch (parseError) {
        logger.warn('Failed to parse target_roles', { error: parseError.message })
      }

      // Determine which users should receive notification
      let userFilters = { is_active: true }

      if (targetAudience === 'role' && Array.isArray(targetRoles) && targetRoles.length > 0) {
        userFilters.role = targetRoles
      }

      if (targetNewUsers) {
        userFilters.is_new_user = true
      }

      // Fetch users and send batch notifications (non-blocking)
      notificationService.sendBatchPromotionNotification(promotion.title, promotion.id, userFilters)
        .catch(err => logger.error('Failed to send promotion notifications', { error: err.message }))
    }

    res.status(201).json({
      message: 'Promotion created successfully',
      data: promotion
    })
  } catch (error) {
    console.error('Error creating promotion:', error)
    res.status(500).json({ message: error.message })
  }
}

/**
 * Update promotion
 */
exports.updatePromotion = async (req, res) => {
  try {
    const { id } = req.params
    const promotion = await Promotion.update(id, req.body)

    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' })
    }

    res.json({
      message: 'Promotion updated successfully',
      data: promotion
    })
  } catch (error) {
    console.error('Error updating promotion:', error)
    res.status(500).json({ message: error.message })
  }
}

/**
 * Delete promotion
 */
exports.deletePromotion = async (req, res) => {
  try {
    const { id } = req.params
    await Promotion.delete(id)

    res.json({ message: 'Promotion deleted successfully' })
  } catch (error) {
    console.error('Error deleting promotion:', error)
    res.status(500).json({ message: error.message })
  }
}

/**
 * Record promotion display
 */
exports.recordDisplay = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const display = await Promotion.recordDisplay(id, userId)
    res.json({
      message: 'Display recorded',
      data: display
    })
  } catch (error) {
    console.error('Error recording display:', error)
    res.status(500).json({ message: error.message })
  }
}

/**
 * Record promotion click
 */
exports.recordClick = async (req, res) => {
  try {
    const { displayId } = req.params

    await Promotion.recordClick(displayId)
    res.json({ message: 'Click recorded' })
  } catch (error) {
    console.error('Error recording click:', error)
    res.status(500).json({ message: error.message })
  }
}

/**
 * Record promotion dismissal
 */
exports.recordDismissal = async (req, res) => {
  try {
    const { displayId } = req.params

    await Promotion.recordDismissal(displayId)
    res.json({ message: 'Dismissal recorded' })
  } catch (error) {
    console.error('Error recording dismissal:', error)
    res.status(500).json({ message: error.message })
  }
}

/**
 * Get promotion statistics
 */
exports.getPromotionStats = async (req, res) => {
  try {
    const { id } = req.params
    const stats = await Promotion.getStatistics(id)

    res.json({ data: stats })
  } catch (error) {
    console.error('Error getting promotion stats:', error)
    res.status(500).json({ message: error.message })
  }
}

/**
 * Get promotion performance over time
 */
exports.getPromotionPerformance = async (req, res) => {
  try {
    const { id } = req.params
    const days = parseInt(req.query.days) || 7

    const performance = await Promotion.getPerformanceOverTime(id, days)
    res.json({ data: performance })
  } catch (error) {
    console.error('Error getting promotion performance:', error)
    res.status(500).json({ message: error.message })
  }
}
