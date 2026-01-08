/**
 * Migration: Add institution_id to users table
 * Links students/users to institutions
 */

exports.up = function (knex) {
    return knex.schema.alterTable('users', (table) => {
        table.uuid('institution_id').nullable().after('role_id');
        table.foreign('institution_id').references('id').inTable('institutions').onDelete('SET NULL');
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable('users', (table) => {
        table.dropForeign('institution_id');
        table.dropColumn('institution_id');
    });
};
