/**
 * Migration: Create parents table and add parent_id to users
 */

exports.up = function (knex) {
    return knex.schema
        // Create parents table
        .createTable('parents', function (table) {
            table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            table.string('first_name').notNullable();
            table.string('last_name').notNullable();
            table.string('email').unique().notNullable();
            table.string('phone');
            table.text('address');
            table.timestamps(true, true);
        })
        // Add parent_id to users table
        .table('users', function (table) {
            table.uuid('parent_id').nullable();
            table.foreign('parent_id').references('id').inTable('parents').onDelete('SET NULL');
            table.index('parent_id');
        })
        // Add permissions
        .then(() => {
            return knex.raw(`
        -- Insert parent permissions
        INSERT INTO permissions (name, resource, action, description) VALUES
        ('parent.create', 'parent', 'create', 'Create new parents'),
        ('parent.read', 'parent', 'read', 'View parents'),
        ('parent.update', 'parent', 'update', 'Update parents'),
        ('parent.delete', 'parent', 'delete', 'Delete parents'),
        ('parent.manage_students', 'parent', 'manage_students', 'Manage students associated with parents')
        ON CONFLICT (resource, action) DO NOTHING;

        -- Assign parent permissions to super_admin
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT 
            (SELECT id FROM roles WHERE name = 'super_admin'),
            id
        FROM permissions
        WHERE resource = 'parent'
        ON CONFLICT (role_id, permission_id) DO NOTHING;

        -- Assign parent permissions to admin
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT 
            (SELECT id FROM roles WHERE name = 'admin'),
            id
        FROM permissions
        WHERE resource = 'parent'
        ON CONFLICT (role_id, permission_id) DO NOTHING;
      `);
        });
};

exports.down = function (knex) {
    return knex.schema
        .table('users', function (table) {
            table.dropColumn('parent_id');
        })
        .dropTableIfExists('parents')
        .then(() => {
            return knex.raw(`
        DELETE FROM role_permissions 
        WHERE permission_id IN (
            SELECT id FROM permissions WHERE resource = 'parent'
        );
        DELETE FROM permissions WHERE resource = 'parent';
      `);
        });
};
