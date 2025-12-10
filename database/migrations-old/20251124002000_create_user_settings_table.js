/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('user_settings', function (table) {
        table.increments('id').primary();
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.string('ui_mode').defaultTo('explorer'); // 'explorer' or 'sidebar'
        table.string('theme').defaultTo('green'); // theme name: 'green', 'red', 'rose', 'blue', 'yellow', 'orange', 'violet'
        table.timestamps(true, true);

        // Ensure one settings row per user
        table.unique('user_id');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('user_settings');
};
