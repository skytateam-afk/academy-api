const express = require('express')
const router = express.Router()
const controller = require('../controllers/promotionController')
const { authenticateToken } = require('../../../middleware/auth')
const { requirePermission } = require('../../../middleware/rbac')
const uploadImage = require('../../../middleware/uploadImage')

/**
 * @route   GET /api/promotions
 * @desc    Get all promotions (Admin)
 * @access  Private (promotion.read or promotion.manage)
 */
router.get(
  '/',
  authenticateToken,
  requirePermission(['promotion.read', 'promotion.manage']),
  controller.getAllPromotions
)

/**
 * @route   GET /api/promotions/active
 * @desc    Get active promotions for current user
 * @access  Private (authenticated users)
 */
router.get(
  '/active',
  authenticateToken,
  controller.getActivePromotions
)

/**
 * @route   GET /api/promotions/:id
 * @desc    Get promotion by ID
 * @access  Private (promotion.read or promotion.manage)
 */
router.get(
  '/:id',
  authenticateToken,
  requirePermission(['promotion.read', 'promotion.manage']),
  controller.getPromotionById
)

/**
 * @route   POST /api/promotions/upload-image
 * @desc    Upload promotion image
 * @access  Private (promotion.create or promotion.manage)
 */
router.post(
  '/upload-image',
  authenticateToken,
  requirePermission(['promotion.create', 'promotion.manage']),
  uploadImage.single('image'),
  controller.uploadImage
)

/**
 * @route   POST /api/promotions
 * @desc    Create promotion
 * @access  Private (promotion.create or promotion.manage)
 */
router.post(
  '/',
  authenticateToken,
  requirePermission(['promotion.create', 'promotion.manage']),
  controller.createPromotion
)

/**
 * @route   PUT /api/promotions/:id
 * @desc    Update promotion
 * @access  Private (promotion.update or promotion.manage)
 */
router.put(
  '/:id',
  authenticateToken,
  requirePermission(['promotion.update', 'promotion.manage']),
  controller.updatePromotion
)

/**
 * @route   DELETE /api/promotions/:id
 * @desc    Delete promotion
 * @access  Private (promotion.delete or promotion.manage)
 */
router.delete(
  '/:id',
  authenticateToken,
  requirePermission(['promotion.delete', 'promotion.manage']),
  controller.deletePromotion
)

/**
 * @route   POST /api/promotions/:id/display
 * @desc    Record promotion display
 * @access  Private (authenticated users)
 */
router.post(
  '/:id/display',
  authenticateToken,
  controller.recordDisplay
)

/**
 * @route   POST /api/promotions/displays/:displayId/click
 * @desc    Record promotion click
 * @access  Private (authenticated users)
 */
router.post(
  '/displays/:displayId/click',
  authenticateToken,
  controller.recordClick
)

/**
 * @route   POST /api/promotions/displays/:displayId/dismiss
 * @desc    Record promotion dismissal
 * @access  Private (authenticated users)
 */
router.post(
  '/displays/:displayId/dismiss',
  authenticateToken,
  controller.recordDismissal
)

/**
 * @route   GET /api/promotions/:id/stats
 * @desc    Get promotion statistics
 * @access  Private (promotion.read or promotion.manage)
 */
router.get(
  '/:id/stats',
  authenticateToken,
  requirePermission(['promotion.read', 'promotion.manage']),
  controller.getPromotionStats
)

/**
 * @route   GET /api/promotions/:id/performance
 * @desc    Get promotion performance over time
 * @access  Private (promotion.read or promotion.manage)
 */
router.get(
  '/:id/performance',
  authenticateToken,
  requirePermission(['promotion.read', 'promotion.manage']),
  controller.getPromotionPerformance
)

module.exports = router
