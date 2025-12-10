/**
 * Add subscription permissions migration
 */

exports.up = function(knex) {
    return knex.raw(`
        -- Insert subscription permissions
        INSERT INTO permissions (name, resource, action, description) VALUES
        ('subscription.manage', 'subscription', 'manage', 'Full subscription management (tiers, subscriptions)'),
        ('subscription.subscribe', 'subscription', 'subscribe', 'Subscribe to subscription tiers'),
        ('subscription.cancel', 'subscription', 'cancel', 'Cancel own subscriptions'),
        ('subscription.view', 'subscription', 'view', 'View subscriptions');

        -- Assign all subscription permissions to super_admin
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT
            r.id as role_id,
            p.id as permission_id
        FROM roles r
        CROSS JOIN permissions p
        WHERE r.name = 'super_admin'
        AND p.name IN ('subscription.manage', 'subscription.subscribe', 'subscription.cancel', 'subscription.view');

        -- Assign subscription management to admin
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT
            r.id as role_id,
            p.id as permission_id
        FROM roles r
        CROSS JOIN permissions p
        WHERE r.name = 'admin'
        AND p.name IN ('subscription.manage', 'subscription.subscribe', 'subscription.cancel', 'subscription.view');

        -- Assign subscription permissions to instructor
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT
            r.id as role_id,
            p.id as permission_id
        FROM roles r
        CROSS JOIN permissions p
        WHERE r.name = 'instructor'
        AND p.name IN ('subscription.subscribe', 'subscription.cancel', 'subscription.view');

        -- Assign subscription permissions to student
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT
            r.id as role_id,
            p.id as permission_id
        FROM roles r
        CROSS JOIN permissions p
        WHERE r.name = 'student'
        AND p.name IN ('subscription.subscribe', 'subscription.cancel', 'subscription.view');
    `);
};

exports.down = function(knex) {
    return knex.raw(`
        -- Remove subscription permissions from roles
        DELETE FROM role_permissions
        WHERE permission_id IN (
            SELECT id FROM permissions
            WHERE name LIKE 'subscription.%'
        );

        -- Remove subscription permissions
        DELETE FROM permissions
        WHERE name LIKE 'subscription.%';
    `);
};
