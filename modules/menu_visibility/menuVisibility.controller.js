/**
 * Menu Visibility Controller
 * Handles menu visibility settings for different user types
 */

const { pool } = require('../../config/database');
const logger = require('../../config/winston');

/**
 * Get menu visibility settings for a specific user type
 */
exports.getMenusByUserType = async (req, res) => {
    try {
        const { userType } = req.params;

        const result = await pool.query(
            `SELECT id, user_type, menu_key, is_visible, display_order
             FROM menu_visibility_settings
             WHERE user_type = $1
             ORDER BY display_order ASC, menu_key ASC`,
            [userType]
        );

        res.json(result.rows);
    } catch (error) {
        logger.error('Error getting menus by user type', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch menu settings' });
    }
};

/**
 * Get all menu visibility settings (for admin settings page)
 */
exports.getAllMenuSettings = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, user_type, menu_key, is_visible, display_order
             FROM menu_visibility_settings
             ORDER BY user_type ASC, display_order ASC, menu_key ASC`
        );

        // Group by user type
        const grouped = result.rows.reduce((acc, menu) => {
            if (!acc[menu.user_type]) {
                acc[menu.user_type] = [];
            }
            acc[menu.user_type].push(menu);
            return acc;
        }, {});

        res.json(grouped);
    } catch (error) {
        logger.error('Error getting all menu settings', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch menu settings' });
    }
};

/**
 * Update menu visibility for a specific menu item
 */
exports.updateMenuVisibility = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_visible, display_order } = req.body;

        const result = await pool.query(
            `UPDATE menu_visibility_settings
             SET is_visible = COALESCE($1, is_visible),
                 display_order = COALESCE($2, display_order),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`,
            [is_visible, display_order, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Menu setting not found' });
        }

        logger.info('Menu visibility updated', { 
            id, 
            is_visible, 
            display_order 
        });

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating menu visibility', { error: error.message });
        res.status(500).json({ error: 'Failed to update menu visibility' });
    }
};

/**
 * Bulk update menu visibility for a user type
 */
exports.bulkUpdateMenus = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { userType } = req.params;
        const { menus } = req.body; // Array of { menu_key, is_visible, display_order }

        if (!Array.isArray(menus)) {
            return res.status(400).json({ error: 'Menus must be an array' });
        }

        await client.query('BEGIN');

        for (const menu of menus) {
            await client.query(
                `UPDATE menu_visibility_settings
                 SET is_visible = $1,
                     display_order = $2,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_type = $3 AND menu_key = $4`,
                [menu.is_visible, menu.display_order, userType, menu.menu_key]
            );
        }

        await client.query('COMMIT');

        logger.info('Bulk menu update completed', { userType, count: menus.length });

        res.json({ 
            message: 'Menu settings updated successfully',
            updated: menus.length 
        });
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Error in bulk menu update', { error: error.message });
        res.status(500).json({ error: 'Failed to update menu settings' });
    } finally {
        client.release();
    }
};

/**
 * Add a new menu item to a user type
 */
exports.addMenuItem = async (req, res) => {
    try {
        const { userType, menuKey, isVisible, displayOrder } = req.body;

        if (!userType || !menuKey) {
            return res.status(400).json({ 
                error: 'User type and menu key are required' 
            });
        }

        const result = await pool.query(
            `INSERT INTO menu_visibility_settings (user_type, menu_key, is_visible, display_order)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_type, menu_key) 
             DO UPDATE SET 
                is_visible = EXCLUDED.is_visible,
                display_order = EXCLUDED.display_order,
                updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [userType, menuKey, isVisible !== undefined ? isVisible : true, displayOrder || 0]
        );

        logger.info('Menu item added', { userType, menuKey });

        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error adding menu item', { error: error.message });
        res.status(500).json({ error: 'Failed to add menu item' });
    }
};

/**
 * Delete a menu item
 */
exports.deleteMenuItem = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM menu_visibility_settings WHERE id = $1 RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Menu item not found' });
        }

        logger.info('Menu item deleted', { id });

        res.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        logger.error('Error deleting menu item', { error: error.message });
        res.status(500).json({ error: 'Failed to delete menu item' });
    }
};

/**
 * Get available user types
 */
exports.getUserTypes = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT DISTINCT user_type 
             FROM menu_visibility_settings 
             ORDER BY user_type ASC`
        );

        res.json(result.rows.map(r => r.user_type));
    } catch (error) {
        logger.error('Error getting user types', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch user types' });
    }
};
