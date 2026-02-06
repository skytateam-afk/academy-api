/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('policy_acceptances', function (table) {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
        table.string('policy_version').notNullable();
        table.string('ip_address').nullable();
        table.text('user_agent').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());

        // Index for faster queries
        table.index(['user_id']);
        table.index(['policy_version']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('policy_acceptances');
};
