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
 * @access  Private (requires role.read permission)
 */
router.get('/resources',
    requirePermission('role.read'),
    permissionController.getResources
);

/**
 * @route   GET /api/permissions
 * @desc    Get all permissions (optionally grouped by resource)
 * @access  Private (requires role.read permission)
 */
router.get('/',
    requirePermission('role.read'),
    permissionController.getAll
);

/**
 * @route   GET /api/permissions/:id
 * @desc    Get permission by ID
 * @access  Private (requires role.read permission)
 */
router.get('/:id',
    requirePermission('role.read'),
    permissionController.getById
);

/**
 * @route   POST /api/permissions
 * @desc    Create new permission
 * @access  Private (super admin only)
 */
router.post('/',
    requireSuperAdmin,
    permissionController.create
);

/**
 * @route   POST /api/permissions/bulk
 * @desc    Bulk create permissions
 * @access  Private (super admin only)
 */
router.post('/bulk',
    requireSuperAdmin,
    permissionController.bulkCreate
);

/**
 * @route   PUT /api/permissions/:id
 * @desc    Update permission
 * @access  Private (super admin only)
 */
router.put('/:id',
    requireSuperAdmin,
    permissionController.update
);

/**
 * @route   DELETE /api/permissions/:id
 * @desc    Delete permission
 * @access  Private (super admin only)
 */
router.delete('/:id',
    requireSuperAdmin,
    permissionController.delete
);

module.exports = router;
