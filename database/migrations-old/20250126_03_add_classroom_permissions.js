/**
 * Add classroom permissions
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.raw(`
    -- Insert classroom permissions
    INSERT INTO permissions (name, resource, action, description) VALUES
    ('classroom.create', 'classroom', 'create', 'Create new classrooms'),
    ('classroom.read', 'classroom', 'read', 'View classrooms'),
    ('classroom.update', 'classroom', 'update', 'Update classrooms'),
    ('classroom.delete', 'classroom', 'delete', 'Delete classrooms'),
    ('classroom.assign_students', 'classroom', 'assign_students', 'Assign students to classrooms')
    ON CONFLICT (resource, action) DO NOTHING;

    -- Assign all classroom permissions to super_admin
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT 
        (SELECT id FROM roles WHERE name = 'super_admin'),
        id
    FROM permissions
    WHERE resource = 'classroom'
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Assign classroom permissions to admin
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT 
        (SELECT id FROM roles WHERE name = 'admin'),
        id
    FROM permissions
    WHERE resource = 'classroom'
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.raw(`
    -- Remove classroom permissions from role_permissions
    DELETE FROM role_permissions 
    WHERE permission_id IN (
        SELECT id FROM permissions WHERE resource = 'classroom'
    );

    -- Remove classroom permissions
    DELETE FROM permissions WHERE resource = 'classroom';
  `);
};
