/**
 * Migration: Create institutions table
 * Allows admins to manage multiple institutions with subscription plans
 */

exports.up = function (knex) {
    return knex.schema.createTable('institutions', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('name', 255).notNullable().unique();
        table.string('official_email', 255).nullable();
        table.text('address').nullable();
        table.string('phone_number', 50).nullable();
        table.uuid('subscription_tier_id').nullable();
        table.timestamp('created_at').defaultTo(new Date()).NotNullable();
        table.timestamp('updated_at').defaultTo(new Date()).NotNullable();
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('institutions');
};
