const express = require('express')
const router = express.Router()
const controller = require('../controllers/announcementController')
const { authenticateToken } = require('../../../middleware/auth')
const { requirePermission } = require('../../../middleware/rbac')

/**
 * @route   GET /api/announcements
 * @desc    Get all announcements (Admin)
 * @access  Private (announcement.read or announcement.manage)
 */
router.get(
  '/',
  authenticateToken,
  requirePermission(['announcement.read', 'announcement.manage']),
  controller.getAllAnnouncements
)

/**
 * @route   GET /api/announcements/active
 * @desc    Get active announcements for current user
 * @access  Private (authenticated users)
 */
router.get(
  '/active',
  authenticateToken,
  controller.getActiveAnnouncements
)

/**
 * @route   GET /api/announcements/:id
 * @desc    Get announcement by ID
 * @access  Private (announcement.read or announcement.manage)
 */
router.get(
  '/:id',
  authenticateToken,
  requirePermission(['announcement.read', 'announcement.manage']),
  controller.getAnnouncementById
)

/**
 * @route   POST /api/announcements
 * @desc    Create announcement
 * @access  Private (announcement.create or announcement.manage)
 */
router.post(
  '/',
  authenticateToken,
  requirePermission(['announcement.create', 'announcement.manage']),
  controller.createAnnouncement
)

/**
 * @route   PUT /api/announcements/:id
 * @desc    Update announcement
 * @access  Private (announcement.update or announcement.manage)
 */
router.put(
  '/:id',
  authenticateToken,
  requirePermission(['announcement.update', 'announcement.manage']),
  controller.updateAnnouncement
)

/**
 * @route   DELETE /api/announcements/:id
 * @desc    Delete announcement
 * @access  Private (announcement.delete or announcement.manage)
 */
router.delete(
  '/:id',
  authenticateToken,
  requirePermission(['announcement.delete', 'announcement.manage']),
  controller.deleteAnnouncement
)

/**
 * @route   POST /api/announcements/:id/view
 * @desc    Mark announcement as viewed
 * @access  Private (authenticated users)
 */
router.post(
  '/:id/view',
  authenticateToken,
  controller.markAsViewed
)

/**
 * @route   POST /api/announcements/:id/dismiss
 * @desc    Dismiss announcement
 * @access  Private (authenticated users)
 */
router.post(
  '/:id/dismiss',
  authenticateToken,
  controller.dismissAnnouncement
)

/**
 * @route   GET /api/announcements/:id/stats
 * @desc    Get announcement statistics
 * @access  Private (announcement.read or announcement.manage)
 */
router.get(
  '/:id/stats',
  authenticateToken,
  requirePermission(['announcement.read', 'announcement.manage']),
  controller.getAnnouncementStats
)

module.exports = router
