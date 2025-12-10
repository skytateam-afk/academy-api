/**
 * Add pathway permissions
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.raw(`
    -- Insert pathway permissions
    INSERT INTO permissions (name, resource, action, description) VALUES
    ('pathway.create', 'pathway', 'create', 'Create new pathways'),
    ('pathway.read', 'pathway', 'read', 'View pathways'),
    ('pathway.update', 'pathway', 'update', 'Update pathways'),
    ('pathway.delete', 'pathway', 'delete', 'Delete pathways'),
    ('pathway.publish', 'pathway', 'publish', 'Publish/unpublish pathways'),
    ('pathway.enroll', 'pathway', 'enroll', 'Enroll in pathways')
    ON CONFLICT (resource, action) DO NOTHING;

    -- Assign all pathway permissions to super_admin
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT 
        (SELECT id FROM roles WHERE name = 'super_admin'),
        id
    FROM permissions
    WHERE resource = 'pathway'
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Assign pathway permissions to admin
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT 
        (SELECT id FROM roles WHERE name = 'admin'),
        id
    FROM permissions
    WHERE name IN ('pathway.create', 'pathway.read', 'pathway.update', 'pathway.delete', 'pathway.publish')
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Assign pathway permissions to instructor
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT 
        (SELECT id FROM roles WHERE name = 'instructor'),
        id
    FROM permissions
    WHERE name IN ('pathway.create', 'pathway.read', 'pathway.update', 'pathway.publish')
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Assign pathway permissions to student
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT 
        (SELECT id FROM roles WHERE name = 'student'),
        id
    FROM permissions
    WHERE name IN ('pathway.read', 'pathway.enroll')
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.raw(`
    -- Remove pathway permissions from role_permissions
    DELETE FROM role_permissions 
    WHERE permission_id IN (
        SELECT id FROM permissions WHERE resource = 'pathway'
    );

    -- Remove pathway permissions
    DELETE FROM permissions WHERE resource = 'pathway';
  `);
};
