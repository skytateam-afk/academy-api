/**
 * Role Routes
 * Defines all role management endpoints
 */

const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { authenticateToken } = require('../../../middleware/auth');
const { requirePermission } = require('../../../middleware/rbac');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/roles
 * @desc    Get all roles
 * @access  Private (requires role.read permission)
 */
router.get('/',
    requirePermission('role.read'),
    roleController.getAll
);

/**
 * @route   GET /api/roles/:id
 * @desc    Get role by ID with permissions
 * @access  Private (requires role.read permission)
 */
router.get('/:id',
    requirePermission('role.read'),
    roleController.getById
);

/**
 * @route   POST /api/roles
 * @desc    Create new role
 * @access  Private (requires role.create permission)
 */
router.post('/',
    requirePermission('role.create'),
    roleController.create
);

/**
 * @route   PUT /api/roles/:id
 * @desc    Update role
 * @access  Private (requires role.update permission)
 */
router.put('/:id',
    requirePermission('role.update'),
    roleController.update
);

/**
 * @route   DELETE /api/roles/:id
 * @desc    Delete role
 * @access  Private (requires role.delete permission)
 */
router.delete('/:id',
    requirePermission('role.delete'),
    roleController.delete
);

/**
 * @route   GET /api/roles/:id/permissions
 * @desc    Get role permissions
 * @access  Private (requires role.read permission)
 */
router.get('/:id/permissions',
    requirePermission('role.read'),
    roleController.getPermissions
);

/**
 * @route   PUT /api/roles/:id/permissions
 * @desc    Sync role permissions (replace all)
 * @access  Private (requires role.update permission)
 */
router.put('/:id/permissions',
    requirePermission('role.update'),
    roleController.syncPermissions
);

/**
 * @route   GET /api/roles/:id/users
 * @desc    Get users with this role
 * @access  Private (requires role.read permission)
 */
router.get('/:id/users',
    requirePermission('role.read'),
    roleController.getUsers
);

module.exports = router;
