/**
 * Dashboard Routes
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../../../middleware/auth');
const { requirePermission } = require('../../../middleware/rbac');

const institutionDashboardRoutes = require('./institutionDashboardRoutes');

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private (requires view_dashboard permission)
 */
router.get(
  '/stats',
  authenticateToken,
  // TODO: Add back when view_dashboard permission is created
  // requirePermission('view_dashboard'),
  dashboardController.getDashboardStats
);

/**
 * @route   GET /api/dashboard/analytics
 * @desc    Get comprehensive analytics data
 * @access  Private (requires analytics.view permission)
 */
router.get(
  '/analytics',
  authenticateToken,
  // TODO: Add back when analytics.view permission is created
  // requirePermission('analytics.view'),
  dashboardController.getAnalyticsData
);

// Institution Dashboard Routes
router.use('/institution', institutionDashboardRoutes);

module.exports = router;

