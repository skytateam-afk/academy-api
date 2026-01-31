/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('pathway_institutions', function (table) {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('pathway_id').notNullable().references('id').inTable('pathways').onDelete('CASCADE');
        table.integer('institution_id').notNullable().references('id').inTable('institutions').onDelete('CASCADE');
        table.timestamp('created_at').defaultTo(knex.fn.now());

        // Unique constraint to prevent duplicate links
        table.unique(['pathway_id', 'institution_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('pathway_institutions');
};
