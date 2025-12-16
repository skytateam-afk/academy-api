/**
 * Permission Routes
 * Defines all permission management endpoints
 */

const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { authenticateToken } = require('../../../middleware/auth');
const { requirePermission, requireSuperAdmin } = require('../../../middleware/rbac');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/permissions/resources
 * @desc    Get all unique resources
 * @access  Private (requires permission.read permission)
 */
router.get('/resources',
    requirePermission('permission.read'),
    permissionController.getResources
);

/**
 * @route   GET /api/permissions
 * @desc    Get all permissions (optionally grouped by resource)
 * @access  Private (requires permission.read permission)
 */
router.get('/',
    requirePermission('permission.read'),
    permissionController.getAll
);

/**
 * @route   GET /api/permissions/:id
 * @desc    Get permission by ID
 * @access  Private (requires permission.read permission)
 */
router.get('/:id',
    requirePermission('permission.read'),
    permissionController.getById
);

/**
 * @route   POST /api/permissions
 * @desc    Create new permission
 * @access  Private (requires permission.create)
 */
router.post('/',
    requirePermission('permission.create'),
    permissionController.create
);

/**
 * @route   POST /api/permissions/bulk
 * @desc    Bulk create permissions
 * @access  Private (requires permission.create)
 */
router.post('/bulk',
    requirePermission('permission.create'),
    permissionController.bulkCreate
);

/**
 * @route   PUT /api/permissions/:id
 * @desc    Update permission
 * @access  Private (requires permission.update)
 */
router.put('/:id',
    requirePermission('permission.update'),
    permissionController.update
);

/**
 * @route   DELETE /api/permissions/:id
 * @desc    Delete permission
 * @access  Private (requires permission.delete)
 */
router.delete('/:id',
    requirePermission('permission.delete'),
    permissionController.delete
);

module.exports = router;
