/**
 * Library Downloads Tracking Table Migration
 * Creates a table to track unique downloads per user-item pair
 */

exports.up = async function(knex) {
  await knex.schema.createTable('library_downloads', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('item_id').notNullable().references('id').inTable('library_items').onDelete('CASCADE');
    table.timestamp('first_downloaded_at').notNullable().defaultTo(knex.fn.now());
    table.integer('download_count').defaultTo(1);
    table.timestamp('last_downloaded_at').notNullable().defaultTo(knex.fn.now());

    // Ensure each user can only have one record per item
    table.unique(['user_id', 'item_id']);
    table.index(['user_id', 'item_id']);
    table.index('first_downloaded_at');
    table.index('last_downloaded_at');
  });

  console.log('✓ Library downloads tracking table created successfully');
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('library_downloads');
  console.log('✓ Library downloads tracking table dropped successfully');
};
