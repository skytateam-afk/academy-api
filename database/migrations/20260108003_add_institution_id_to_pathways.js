/**
 * Migration: Add institution_id to pathways table
 * Links pathways to specific institutions
 */

exports.up = function (knex) {
    return knex.schema.alterTable('pathways', (table) => {
        table.uuid('institution_id').nullable().after('created_by');
        table.foreign('institution_id').references('id').inTable('institutions').onDelete('SET NULL');
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable('pathways', (table) => {
        table.dropForeign('institution_id');
        table.dropColumn('institution_id');
    });
};
