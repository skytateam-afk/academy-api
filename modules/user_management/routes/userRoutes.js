/**
 * User Routes
 * Defines all user management endpoints
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../../../middleware/auth');
const { requirePermission, requireAdmin } = require('../../../middleware/rbac');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit for avatars
    }
});

/**
 * @route   GET /api/users/public/@:username
 * @desc    Get public profile by username
 * @access  Public (no authentication required)
 */
router.get('/public/@:username',
    userController.getPublicProfile
);

/**
 * @route   GET /api/users/debug/:userId
 * @desc    Debug certificate query
 * @access  Public (for debugging)
 */
router.get('/debug/:userId',
    userController.debugCertificates
);

// All routes below require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filters
 * @access  Private (requires user.read permission)
 */
router.get('/', 
    requirePermission('user.read'),
    userController.getAll
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (requires user.read permission or self)
 */
router.get('/:id',
    requirePermission('user.read', {
        allowSelf: true,
        getSelfId: (req) => req.params.id
    }),
    userController.getById
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (requires user.create permission)
 */
router.post('/',
    requirePermission('user.create'),
    userController.create
);

/**
 * @route   POST /api/users/bulk-import
 * @desc    Bulk import users from CSV file
 * @access  Private (requires user.create permission)
 */
router.post('/bulk-import',
    requirePermission('user.create'),
    upload.single('file'),
    userController.bulkImport
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (requires user.update permission or self)
 */
router.put('/:id',
    requirePermission('user.update', {
        allowSelf: true,
        getSelfId: (req) => req.params.id
    }),
    userController.update
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (requires user.delete permission)
 */
router.delete('/:id',
    requirePermission('user.delete'),
    userController.delete
);

/**
 * @route   PUT /api/users/:id/role
 * @desc    Update user role
 * @access  Private (requires user.manage_roles permission)
 */
router.put('/:id/role',
    requirePermission('user.manage_roles'),
    userController.updateRole
);

/**
 * @route   PUT /api/users/:id/password
 * @desc    Update user password
 * @access  Private (self or admin)
 */
router.put('/:id/password',
    userController.updatePassword
);

/**
 * @route   PATCH /api/users/:id/toggle-status
 * @desc    Toggle user active status
 * @access  Private (requires user.update permission)
 */
router.patch('/:id/toggle-status',
    requirePermission('user.update'),
    userController.toggleStatus
);

/**
 * @route   GET /api/users/:id/permissions
 * @desc    Get user permissions
 * @access  Private (requires user.read permission or self)
 */
router.get('/:id/permissions',
    requirePermission('user.read', {
        allowSelf: true,
        getSelfId: (req) => req.params.id
    }),
    userController.getPermissions
);

/**
 * @route   POST /api/users/:id/permissions
 * @desc    Grant permission to user
 * @access  Private (requires user.manage_roles permission)
 */
router.post('/:id/permissions',
    requirePermission('user.manage_roles'),
    userController.grantPermission
);

/**
 * @route   DELETE /api/users/:id/permissions/:permissionName
 * @desc    Revoke permission from user
 * @access  Private (requires user.manage_roles permission)
 */
router.delete('/:id/permissions/:permissionName',
    requirePermission('user.manage_roles'),
    userController.revokePermission
);

/**
 * @route   POST /api/users/:id/avatar
 * @desc    Upload user avatar
 * @access  Private (self or admin)
 */
router.post('/:id/avatar',
    upload.single('avatar'),
    requirePermission('user.update', {
        allowSelf: true,
        getSelfId: (req) => req.params.id
    }),
    userController.uploadAvatar
);

module.exports = router;
