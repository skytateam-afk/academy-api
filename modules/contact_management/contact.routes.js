/**
 * Contact Management Routes
 */

const express = require('express');
const router = express.Router();
const contactController = require('./contact.controller');
const { authenticateToken } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');

// ===== PUBLIC ROUTES =====

/**
 * @route   POST /api/contact/submit
 * @desc    Submit contact form (public)
 * @access  Public
 */
router.post('/submit', contactController.submitContact);

// ===== ADMIN ROUTES =====

/**
 * @route   GET /api/contact/statistics
 * @desc    Get contact submission statistics
 * @access  Admin (contact.read)
 */
router.get(
  '/statistics',
  authenticateToken,
  requirePermission('contact.read'),
  contactController.getStatistics
);

/**
 * @route   GET /api/contact/submissions
 * @desc    List all contact submissions with pagination
 * @access  Admin (contact.read)
 */
router.get(
  '/submissions',
  authenticateToken,
  requirePermission('contact.read'),
  contactController.listSubmissions
);

/**
 * @route   GET /api/contact/submissions/:id
 * @desc    Get single contact submission
 * @access  Admin (contact.read)
 */
router.get(
  '/submissions/:id',
  authenticateToken,
  requirePermission('contact.read'),
  contactController.getSubmission
);

/**
 * @route   PUT /api/contact/submissions/:id
 * @desc    Update contact submission (status, notes)
 * @access  Admin (contact.update)
 */
router.put(
  '/submissions/:id',
  authenticateToken,
  requirePermission('contact.update'),
  contactController.updateSubmission
);

/**
 * @route   PATCH /api/contact/submissions/:id/read
 * @desc    Mark submission as read
 * @access  Admin (contact.update)
 */
router.patch(
  '/submissions/:id/read',
  authenticateToken,
  requirePermission('contact.update'),
  contactController.markAsRead
);

/**
 * @route   PATCH /api/contact/submissions/:id/unread
 * @desc    Mark submission as unread
 * @access  Admin (contact.update)
 */
router.patch(
  '/submissions/:id/unread',
  authenticateToken,
  requirePermission('contact.update'),
  contactController.markAsUnread
);

/**
 * @route   DELETE /api/contact/submissions/:id
 * @desc    Delete contact submission
 * @access  Admin (contact.delete)
 */
router.delete(
  '/submissions/:id',
  authenticateToken,
  requirePermission('contact.delete'),
  contactController.deleteSubmission
);

module.exports = router;
