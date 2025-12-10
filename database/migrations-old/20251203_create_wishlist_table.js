/**
 * Migration: Create user_wishlist table
 * 
 * This table stores items (courses and library items) that users want to view later
 */

exports.up = function(knex) {
  return knex.schema.createTable('user_wishlist', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable()
      .references('id').inTable('users')
      .onDelete('CASCADE');
    table.enum('item_type', ['course', 'library_item']).notNullable();
    table.uuid('item_id').notNullable();
    table.text('notes'); // Optional notes from user
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Unique constraint: user can only wishlist an item once
    table.unique(['user_id', 'item_type', 'item_id']);
    
    // Indexes for performance
    table.index('user_id');
    table.index(['user_id', 'item_type']);
    table.index('created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('user_wishlist');
};
