/**
 * Menu Management Controller
 * Handles HTTP requests for menu CRUD operations
 */

const menuManagementService = require('./menuManagement.service');
const logger = require('../../config/winston');

class MenuManagementController {
    /**
     * List all menu items with pagination
     */
    async listMenuItems(req, res, next) {
        try {
            const result = await menuManagementService.listMenuItems(req.query);
            res.json({ success: true, data: result });
        } catch (error) {
            logger.error('Error listing menu items', { error: error.message });
            next(error);
        }
    }

    /**
     * Get a single menu item by ID
     */
    async getMenuItem(req, res, next) {
        try {
            const menu = await menuManagementService.getMenuItemById(req.params.id);
            res.json({ success: true, data: menu });
        } catch (error) {
            logger.error('Error getting menu item', { error: error.message });
            next(error);
        }
    }

    /**
     * Create a new menu item
     */
    async createMenuItem(req, res, next) {
        try {
            const menu = await menuManagementService.createMenuItem(req.body);
            res.status(201).json({ 
                success: true, 
                data: menu,
                message: 'Menu item created successfully'
            });
        } catch (error) {
            logger.error('Error creating menu item', { error: error.message });
            next(error);
        }
    }

    /**
     * Update a menu item
     */
    async updateMenuItem(req, res, next) {
        try {
            const menu = await menuManagementService.updateMenuItem(
                req.params.id,
                req.body
            );
            res.json({ 
                success: true, 
                data: menu,
                message: 'Menu item updated successfully'
            });
        } catch (error) {
            logger.error('Error updating menu item', { error: error.message });
            next(error);
        }
    }

    /**
     * Delete a menu item
     */
    async deleteMenuItem(req, res, next) {
        try {
            const result = await menuManagementService.deleteMenuItem(req.params.id);
            res.json({ 
                success: true, 
                message: result.message
            });
        } catch (error) {
            logger.error('Error deleting menu item', { error: error.message });
            next(error);
        }
    }

    /**
     * Toggle menu item status
     */
    async toggleMenuStatus(req, res, next) {
        try {
            const menu = await menuManagementService.toggleMenuStatus(req.params.id);
            res.json({ 
                success: true, 
                data: menu,
                message: `Menu ${menu.is_active ? 'activated' : 'deactivated'} successfully`
            });
        } catch (error) {
            logger.error('Error toggling menu status', { error: error.message });
            next(error);
        }
    }

    /**
     * Get menus for a specific user type (public endpoint for navigation)
     */
    async getMenusByUserType(req, res, next) {
        try {
            const { userType } = req.params;
            const menus = await menuManagementService.getMenusByUserType(userType);
            res.json({ success: true, data: menus });
        } catch (error) {
            logger.error('Error getting menus by user type', { error: error.message });
            next(error);
        }
    }

    /**
     * Get available user types
     */
    async getUserTypes(req, res, next) {
        try {
            const userTypes = await menuManagementService.getAvailableUserTypes();
            res.json({ success: true, data: userTypes });
        } catch (error) {
            logger.error('Error getting user types', { error: error.message });
            next(error);
        }
    }
}

module.exports = new MenuManagementController();
