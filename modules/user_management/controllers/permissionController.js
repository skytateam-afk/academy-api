/**
 * Permission Controller
 * Handles HTTP requests for permission management
 */

const Permission = require('../../../models/Permission');
const logger = require('../../../config/winston');

class PermissionController {
    /**
     * Get all permissions
     * GET /api/permissions
     */
    async getAll(req, res) {
        try {
            const { resource, group_by_resource } = req.query;

            const permissions = await Permission.getAll({
                resource,
                groupByResource: group_by_resource === 'true'
            });

            res.json({
                success: true,
                data: permissions
            });
        } catch (error) {
            logger.error('Error getting permissions', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Error retrieving permissions',
                error: error.message
            });
        }
    }

    /**
     * Get permission by ID
     * GET /api/permissions/:id
     */
    async getById(req, res) {
        try {
            const { id } = req.params;

            const permission = await Permission.findById(id);

            if (!permission) {
                return res.status(404).json({
                    success: false,
                    message: 'Permission not found'
                });
            }

            // Get roles and users with this permission
            const [roles, users] = await Promise.all([
                Permission.getRoles(id),
                Permission.getUsers(id)
            ]);

            res.json({
                success: true,
                data: {
                    ...permission,
                    roles,
                    users
                }
            });
        } catch (error) {
            logger.error('Error getting permission', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Error retrieving permission',
                error: error.message
            });
        }
    }

    /**
     * Get all resources
     * GET /api/permissions/resources
     */
    async getResources(req, res) {
        try {
            const resources = await Permission.getResources();

            res.json({
                success: true,
                data: resources
            });
        } catch (error) {
            logger.error('Error getting resources', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Error retrieving resources',
                error: error.message
            });
        }
    }

    /**
     * Create new permission
     * POST /api/permissions
     */
    async create(req, res) {
        try {
            const { name, resource, action, description } = req.body;

            if (!name || !resource || !action) {
                return res.status(400).json({
                    success: false,
                    message: 'Name, resource, and action are required'
                });
            }

            const permission = await Permission.create({
                name,
                resource,
                action,
                description
            });

            res.status(201).json({
                success: true,
                message: 'Permission created successfully',
                data: permission
            });
        } catch (error) {
            logger.error('Error creating permission', { error: error.message });
            res.status(400).json({
                success: false,
                message: error.message || 'Error creating permission'
            });
        }
    }

    /**
     * Bulk create permissions
     * POST /api/permissions/bulk
     */
    async bulkCreate(req, res) {
        try {
            const { permissions } = req.body;

            if (!Array.isArray(permissions) || permissions.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Permissions array is required'
                });
            }

            const created = await Permission.bulkCreate(permissions);

            res.status(201).json({
                success: true,
                message: `${created.length} permissions created successfully`,
                data: created
            });
        } catch (error) {
            logger.error('Error bulk creating permissions', { error: error.message });
            res.status(400).json({
                success: false,
                message: error.message || 'Error creating permissions'
            });
        }
    }

    /**
     * Update permission
     * PUT /api/permissions/:id
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const permission = await Permission.update(id, updates);

            res.json({
                success: true,
                message: 'Permission updated successfully',
                data: permission
            });
        } catch (error) {
            logger.error('Error updating permission', { error: error.message });
            res.status(400).json({
                success: false,
                message: error.message || 'Error updating permission'
            });
        }
    }

    /**
     * Delete permission
     * DELETE /api/permissions/:id
     */
    async delete(req, res) {
        try {
            const { id } = req.params;

            const deleted = await Permission.delete(id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Permission not found'
                });
            }

            res.json({
                success: true,
                message: 'Permission deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting permission', { error: error.message });
            res.status(400).json({
                success: false,
                message: error.message || 'Error deleting permission'
            });
        }
    }
}

module.exports = new PermissionController();
