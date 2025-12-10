const express = require('express');
const router = express.Router();
const searchController = require('./search.controller');
const { authenticateToken } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');

/**
 * @route   GET /api/search
 * @desc    Unified search across multiple modules
 * @access  Private (all authenticated users)
 * @query   q - search query (required)
 * @query   modules - comma-separated list of modules to search (optional)
 * @query   limit - max results per module (optional, default: 5)
 */
router.get('/', authenticateToken, searchController.search);

/**
 * @route   GET /api/search/tags
 * @desc    Tag-based search across modules (admin/staff only)
 * @access  Private (admin, super_admin, staff, teacher)
 * @query   tag - tag to search for (required)
 * @query   modules - comma-separated list of modules to search (optional)
 * @query   limit - max results per module (optional, default: 10)
 */
router.get('/tags', 
  authenticateToken, 
  requireRole(['admin', 'super_admin', 'staff', 'teacher']),
  searchController.searchByTag
);

module.exports = router;
