/**
 * Migration: Add Announcements and Promotions Permissions
 * Adds permissions for announcement and promotion management
 */

exports.up = function(knex) {
  return knex.raw(`
    -- Insert announcement permissions
    INSERT INTO permissions (name, resource, action, description) VALUES
    ('announcement.read', 'announcement', 'read', 'View announcements'),
    ('announcement.create', 'announcement', 'create', 'Create announcements'),
    ('announcement.update', 'announcement', 'update', 'Update announcements'),
    ('announcement.delete', 'announcement', 'delete', 'Delete announcements'),
    ('announcement.manage', 'announcement', 'manage', 'Full announcement management access')
    ON CONFLICT (resource, action) DO NOTHING;

    -- Insert promotion permissions
    INSERT INTO permissions (name, resource, action, description) VALUES
    ('promotion.read', 'promotion', 'read', 'View promotions'),
    ('promotion.create', 'promotion', 'create', 'Create promotions'),
    ('promotion.update', 'promotion', 'update', 'Update promotions'),
    ('promotion.delete', 'promotion', 'delete', 'Delete promotions'),
    ('promotion.manage', 'promotion', 'manage', 'Full promotion management access')
    ON CONFLICT (resource, action) DO NOTHING;

    -- Assign all announcement and promotion permissions to super_admin
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT 
        (SELECT id FROM roles WHERE name = 'super_admin'),
        id
    FROM permissions
    WHERE resource IN ('announcement', 'promotion')
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Assign announcement and promotion permissions to admin
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT 
        (SELECT id FROM roles WHERE name = 'admin'),
        id
    FROM permissions
    WHERE resource IN ('announcement', 'promotion')
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Assign announcement read permission to instructor
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT 
        (SELECT id FROM roles WHERE name = 'instructor'),
        id
    FROM permissions
    WHERE name = 'announcement.read'
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Assign announcement read permission to student
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT 
        (SELECT id FROM roles WHERE name = 'student'),
        id
    FROM permissions
    WHERE name = 'announcement.read'
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  `);
};

exports.down = function(knex) {
  return knex.raw(`
    -- Remove announcement and promotion permissions from role_permissions
    DELETE FROM role_permissions 
    WHERE permission_id IN (
        SELECT id FROM permissions WHERE resource IN ('announcement', 'promotion')
    );

    -- Remove announcement and promotion permissions
    DELETE FROM permissions WHERE resource IN ('announcement', 'promotion');
  `);
};
