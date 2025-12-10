/**
 * Menu Visibility & Management Routes
 */

const express = require('express');
const router = express.Router();
const menuVisibilityController = require('./menuVisibility.controller');
const menuManagementController = require('./menuManagement.controller');
const { authenticateToken } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');

// ===== Menu Management Routes (CRUD for menu items) =====

// List all menu items with pagination (Admin)
router.get(
    '/items',
    authenticateToken,
    requirePermission('menu.read'),
    menuManagementController.listMenuItems
);

// Get single menu item (Admin)
router.get(
    '/items/:id',
    authenticateToken,
    requirePermission('menu.read'),
    menuManagementController.getMenuItem
);

// Create menu item (Admin)
router.post(
    '/items',
    authenticateToken,
    requirePermission('menu.create'),
    menuManagementController.createMenuItem
);

// Update menu item (Admin)
router.put(
    '/items/:id',
    authenticateToken,
    requirePermission('menu.update'),
    menuManagementController.updateMenuItem
);

// Delete menu item (Admin)
router.delete(
    '/items/:id',
    authenticateToken,
    requirePermission('menu.delete'),
    menuManagementController.deleteMenuItem
);

// Toggle menu status (Admin)
router.patch(
    '/items/:id/toggle',
    authenticateToken,
    requirePermission('menu.update'),
    menuManagementController.toggleMenuStatus
);

// Get menus by user type (public endpoint for frontend navigation)
router.get('/menus/:userType', menuManagementController.getMenusByUserType);

// Get available user types
router.get(
    '/user-types',
    authenticateToken,
    requirePermission('menu.read'),
    menuManagementController.getUserTypes
);

// ===== Legacy Menu Visibility Routes =====

// Get menu settings for a specific user type (legacy)
router.get('/user-type/:userType', menuVisibilityController.getMenusByUserType);

// Admin-only routes (legacy)
router.get(
    '/all',
    authenticateToken,
    requirePermission('settings.read'),
    menuVisibilityController.getAllMenuSettings
);

router.put(
    '/:id',
    authenticateToken,
    requirePermission('settings.update'),
    menuVisibilityController.updateMenuVisibility
);

router.post(
    '/bulk/:userType',
    authenticateToken,
    requirePermission('settings.update'),
    menuVisibilityController.bulkUpdateMenus
);

router.post(
    '/',
    authenticateToken,
    requirePermission('settings.create'),
    menuVisibilityController.addMenuItem
);

router.delete(
    '/:id',
    authenticateToken,
    requirePermission('settings.delete'),
    menuVisibilityController.deleteMenuItem
);

module.exports = router;
