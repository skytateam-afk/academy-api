/**
 * Migration to fix incorrect individual UNIQUE constraints on mapping tables.
 * These constraints were accidentally added to schema.sql and might exist in some environments.
 * They prevent multiple roles/users from sharing the same permissions.
 */

exports.up = async function (knex) {
    // role_permissions table
    try {
        await knex.schema.alterTable('role_permissions', (table) => {
            // Postgres default names for UNIQUE constraints are usually table_column_unique
            table.dropUnique(['role_id']).catch(() => { });
            table.dropUnique(['permission_id']).catch(() => { });
        });
    } catch (e) {
        // Ignore errors if constraints don't exist
    }

    // user_permissions table
    try {
        await knex.schema.alterTable('user_permissions', (table) => {
            table.dropUnique(['user_id']).catch(() => { });
            table.dropUnique(['permission_id']).catch(() => { });
        });
    } catch (e) {
    }

    // users_permissions table
    try {
        await knex.schema.alterTable('users_permissions', (table) => {
            table.dropUnique(['user_id']).catch(() => { });
            table.dropUnique(['permission_id']).catch(() => { });
        });
    } catch (e) {
    }

    // Ensure the composite unique constraints exist (they should, but just in case)
    // We use .onConflict in migrations usually, but here we just ensure the constraint is there.
    // Note: unique(['col1', 'col2']) in knex adds it if missing or errors if exists.
    // But unique_role_permission already exists in the original migration.
};

exports.down = async function (knex) {
    // No-op: we don't want to bring back incorrect constraints
};
