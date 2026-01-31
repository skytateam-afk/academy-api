/**
 * Create partners table
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('partners', function (table) {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('inquiry_type').notNullable();
        table.string('full_name').notNullable();
        table.string('organization').notNullable();
        table.string('email_address').notNullable();
        table.text('message').notNullable();
        table.string('status').defaultTo('new');
        table.timestamps(true, true);
    });
};

/**
 * Drop partners table
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('partners');
};
