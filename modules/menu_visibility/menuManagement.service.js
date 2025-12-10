/**
 * Menu Management Service
 * Handles business logic for menu CRUD operations
 */

const { pool } = require('../../config/database');
const logger = require('../../config/winston');

class MenuManagementService {
    /**
     * List all menu items with pagination and filters
     */
    async listMenuItems(filters = {}) {
        const {
            page = 1,
            limit = 10,
            query = '',
            userType = '',
            isActive = '',
            sortBy = 'display_order',
            sortOrder = 'ASC'
        } = filters;

        const offset = (page - 1) * limit;
        const conditions = [];
        const params = [];
        let paramIndex = 1;

        // Build WHERE conditions
        if (query) {
            conditions.push(`(
                mi.menu_key ILIKE $${paramIndex} OR 
                mi.label ILIKE $${paramIndex} OR 
                mi.description ILIKE $${paramIndex} OR
                mi.route_path ILIKE $${paramIndex}
            )`);
            params.push(`%${query}%`);
            paramIndex++;
        }

        if (isActive !== '' && isActive !== 'all') {
            conditions.push(`mi.is_active = $${paramIndex}`);
            params.push(isActive === 'true' || isActive === true);
            paramIndex++;
        }

        // Add user type filter
        let userTypeJoin = '';
        if (userType && userType !== 'all') {
            userTypeJoin = 'INNER JOIN menu_item_user_types mut_filter ON mi.id = mut_filter.menu_item_id';
            conditions.push(`mut_filter.user_type = $${paramIndex}`);
            params.push(userType);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Get total count
        const countQuery = `
            SELECT COUNT(DISTINCT mi.id) as total
            FROM menu_items mi
            ${userTypeJoin}
            ${whereClause}
        `;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total);

        // Get menu items with user types
        const validSortColumns = ['menu_key', 'label', 'display_order', 'created_at', 'is_active'];
        const validSortOrders = ['ASC', 'DESC'];
        const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'display_order';
        const safeSortOrder = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

        const dataQuery = `
            SELECT 
                mi.*,
                COALESCE(
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'user_type', mut.user_type,
                            'is_visible', mut.is_visible
                        )
                    ) FILTER (WHERE mut.user_type IS NOT NULL),
                    '[]'::json
                ) as user_types
            FROM menu_items mi
            ${userTypeJoin}
            LEFT JOIN menu_item_user_types mut ON mi.id = mut.menu_item_id
            ${whereClause}
            GROUP BY mi.id
            ORDER BY mi.${safeSortBy} ${safeSortOrder}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        params.push(limit, offset);
        const result = await pool.query(dataQuery, params);

        return {
            menus: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get a single menu item by ID
     */
    async getMenuItemById(id) {
        const query = `
            SELECT 
                mi.*,
                COALESCE(
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'user_type', mut.user_type,
                            'is_visible', mut.is_visible
                        )
                    ) FILTER (WHERE mut.user_type IS NOT NULL),
                    '[]'::json
                ) as user_types
            FROM menu_items mi
            LEFT JOIN menu_item_user_types mut ON mi.id = mut.menu_item_id
            WHERE mi.id = $1
            GROUP BY mi.id
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            throw new Error('Menu item not found');
        }

        return result.rows[0];
    }

    /**
     * Create a new menu item
     */
    async createMenuItem(menuData) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const {
                menu_key,
                label,
                description,
                route_path,
                route_name,
                icon,
                parent_id,
                display_order,
                is_active,
                is_external,
                target,
                badge_text,
                badge_variant,
                requires_auth,
                metadata,
                user_types
            } = menuData;

            // Validate required fields
            if (!menu_key || !label) {
                throw new Error('Menu key and label are required');
            }

            // Check if menu_key already exists
            const checkResult = await client.query(
                'SELECT id FROM menu_items WHERE menu_key = $1',
                [menu_key]
            );

            if (checkResult.rows.length > 0) {
                throw new Error('Menu key already exists');
            }

            // Insert menu item
            const insertQuery = `
                INSERT INTO menu_items (
                    menu_key, label, description, route_path, route_name,
                    icon, parent_id, display_order, is_active, is_external,
                    target, badge_text, badge_variant, requires_auth, metadata
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                RETURNING *
            `;

            const insertResult = await client.query(insertQuery, [
                menu_key,
                label,
                description || null,
                route_path || null,
                route_name || null,
                icon || null,
                parent_id || null,
                display_order || 0,
                is_active !== undefined ? is_active : true,
                is_external || false,
                target || '_self',
                badge_text || null,
                badge_variant || null,
                requires_auth || false,
                metadata ? JSON.stringify(metadata) : null
            ]);

            const menuItem = insertResult.rows[0];

            // Insert user type associations
            if (user_types && Array.isArray(user_types)) {
                for (const userType of user_types) {
                    await client.query(
                        `INSERT INTO menu_item_user_types (menu_item_id, user_type, is_visible)
                         VALUES ($1, $2, $3)`,
                        [menuItem.id, userType, true]
                    );
                }
            }

            await client.query('COMMIT');

            logger.info('Menu item created', { 
                menuId: menuItem.id, 
                menu_key,
                user_types
            });

            return await this.getMenuItemById(menuItem.id);
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error creating menu item', { error: error.message });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Update a menu item
     */
    async updateMenuItem(id, menuData) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const {
                menu_key,
                label,
                description,
                route_path,
                route_name,
                icon,
                parent_id,
                display_order,
                is_active,
                is_external,
                target,
                badge_text,
                badge_variant,
                requires_auth,
                metadata,
                user_types
            } = menuData;

            // Check if menu exists
            const checkResult = await client.query(
                'SELECT id FROM menu_items WHERE id = $1',
                [id]
            );

            if (checkResult.rows.length === 0) {
                throw new Error('Menu item not found');
            }

            // If menu_key is being updated, check for duplicates
            if (menu_key) {
                const duplicateCheck = await client.query(
                    'SELECT id FROM menu_items WHERE menu_key = $1 AND id != $2',
                    [menu_key, id]
                );

                if (duplicateCheck.rows.length > 0) {
                    throw new Error('Menu key already exists');
                }
            }

            // Build update query dynamically
            const updates = [];
            const params = [];
            let paramIndex = 1;

            if (menu_key !== undefined) {
                updates.push(`menu_key = $${paramIndex++}`);
                params.push(menu_key);
            }
            if (label !== undefined) {
                updates.push(`label = $${paramIndex++}`);
                params.push(label);
            }
            if (description !== undefined) {
                updates.push(`description = $${paramIndex++}`);
                params.push(description);
            }
            if (route_path !== undefined) {
                updates.push(`route_path = $${paramIndex++}`);
                params.push(route_path);
            }
            if (route_name !== undefined) {
                updates.push(`route_name = $${paramIndex++}`);
                params.push(route_name);
            }
            if (icon !== undefined) {
                updates.push(`icon = $${paramIndex++}`);
                params.push(icon);
            }
            // Handle parent_id explicitly - undefined means set to null
            if (parent_id !== undefined) {
                updates.push(`parent_id = $${paramIndex++}`);
                params.push(parent_id === null || parent_id === undefined ? null : parent_id);
            }
            if (display_order !== undefined) {
                updates.push(`display_order = $${paramIndex++}`);
                params.push(display_order);
            }
            if (is_active !== undefined) {
                updates.push(`is_active = $${paramIndex++}`);
                params.push(is_active);
            }
            if (is_external !== undefined) {
                updates.push(`is_external = $${paramIndex++}`);
                params.push(is_external);
            }
            if (target !== undefined) {
                updates.push(`target = $${paramIndex++}`);
                params.push(target);
            }
            if (badge_text !== undefined) {
                updates.push(`badge_text = $${paramIndex++}`);
                params.push(badge_text);
            }
            if (badge_variant !== undefined) {
                updates.push(`badge_variant = $${paramIndex++}`);
                params.push(badge_variant);
            }
            if (requires_auth !== undefined) {
                updates.push(`requires_auth = $${paramIndex++}`);
                params.push(requires_auth);
            }
            if (metadata !== undefined) {
                updates.push(`metadata = $${paramIndex++}`);
                params.push(metadata ? JSON.stringify(metadata) : null);
            }

            updates.push(`updated_at = CURRENT_TIMESTAMP`);
            params.push(id);

            const updateQuery = `
                UPDATE menu_items
                SET ${updates.join(', ')}
                WHERE id = $${paramIndex}
                RETURNING *
            `;

            await client.query(updateQuery, params);

            // Update user type associations if provided
            if (user_types && Array.isArray(user_types)) {
                // Delete existing associations
                await client.query(
                    'DELETE FROM menu_item_user_types WHERE menu_item_id = $1',
                    [id]
                );

                // Insert new associations
                for (const userType of user_types) {
                    await client.query(
                        `INSERT INTO menu_item_user_types (menu_item_id, user_type, is_visible)
                         VALUES ($1, $2, $3)`,
                        [id, userType, true]
                    );
                }
            }

            await client.query('COMMIT');

            logger.info('Menu item updated', { menuId: id });

            return await this.getMenuItemById(id);
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error updating menu item', { error: error.message });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Delete a menu item
     */
    async deleteMenuItem(id) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Check if menu has children
            const childrenCheck = await client.query(
                'SELECT COUNT(*) as count FROM menu_items WHERE parent_id = $1',
                [id]
            );

            if (parseInt(childrenCheck.rows[0].count) > 0) {
                throw new Error('Cannot delete menu item with children. Please delete or reassign child items first.');
            }

            // Delete menu item (cascade will handle user_types)
            const result = await client.query(
                'DELETE FROM menu_items WHERE id = $1 RETURNING *',
                [id]
            );

            if (result.rows.length === 0) {
                throw new Error('Menu item not found');
            }

            await client.query('COMMIT');

            logger.info('Menu item deleted', { menuId: id });

            return { message: 'Menu item deleted successfully' };
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error deleting menu item', { error: error.message });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Toggle menu item active status
     */
    async toggleMenuStatus(id) {
        const query = `
            UPDATE menu_items
            SET is_active = NOT is_active,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            throw new Error('Menu item not found');
        }

        logger.info('Menu status toggled', { 
            menuId: id, 
            is_active: result.rows[0].is_active 
        });

        return result.rows[0];
    }

    /**
     * Get menu items by user type (for frontend navigation)
     */
    async getMenusByUserType(userType) {
        const query = `
            SELECT 
                mi.id,
                mi.menu_key,
                mi.label,
                mi.description,
                mi.route_path,
                mi.route_name,
                mi.icon,
                mi.parent_id,
                mi.display_order,
                mi.is_external,
                mi.target,
                mi.badge_text,
                mi.badge_variant,
                mi.requires_auth
            FROM menu_items mi
            INNER JOIN menu_item_user_types mut ON mi.id = mut.menu_item_id
            WHERE mut.user_type = $1 
              AND mut.is_visible = true
              AND mi.is_active = true
            ORDER BY mi.display_order ASC, mi.label ASC
        `;

        const result = await pool.query(query, [userType]);
        return result.rows;
    }

    /**
     * Get available user types
     */
    async getAvailableUserTypes() {
        return ['public', 'student', 'teacher', 'admin', 'staff', 'parent'];
    }
}

module.exports = new MenuManagementService();
