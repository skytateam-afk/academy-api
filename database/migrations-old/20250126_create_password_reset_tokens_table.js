/**
 * Migration: Create password_reset_tokens table
 * 
 * This table stores temporary password reset tokens for users
 * who have requested to reset their password.
 */

exports.up = async function(knex) {
  const exists = await knex.schema.hasTable('password_reset_tokens');
  if (!exists) {
    return knex.schema.createTable('password_reset_tokens', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.string('token', 255).notNullable().unique();
      table.timestamp('expires_at').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());

      // Foreign key constraint
      table.foreign('user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');

      // Index for faster lookups
      table.index('token');
      table.index('user_id');
      table.index('expires_at');
    });
  }
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('password_reset_tokens');
};
