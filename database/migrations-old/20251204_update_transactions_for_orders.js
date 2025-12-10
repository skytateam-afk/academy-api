/**
 * Migration: Update Transactions for Orders
 * Makes course_id nullable and adds order_id to transactions table
 */

exports.up = function (knex) {
    return knex.schema.alterTable('transactions', table => {
        // Make course_id nullable
        table.uuid('course_id').nullable().alter();

        // Add order_id
        table.uuid('order_id').references('id').inTable('shop_orders').onDelete('SET NULL');

        // Add index for order_id
        table.index('order_id');
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable('transactions', table => {
        // Revert course_id to not nullable (this might fail if there are records with null course_id)
        // We'll leave it nullable in down migration to be safe, or we'd need to delete those records first
        // table.uuid('course_id').notNullable().alter();

        // Remove order_id
        table.dropColumn('order_id');
    });
};
