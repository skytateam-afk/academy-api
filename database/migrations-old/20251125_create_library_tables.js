/**
 * Library Management Tables Migration
 * Creates all necessary tables for the library management system
 */

exports.up = async function(knex) {
  // 1. Library Categories table
  await knex.schema.createTable('library_categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).notNullable().unique();
    table.string('slug', 100).notNullable().unique();
    table.text('description');
    table.string('icon', 50);
    table.integer('sort_order').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index('slug');
    table.index('is_active');
  });

  // 2. Library Items table
  await knex.schema.createTable('library_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title', 255).notNullable();
    table.string('isbn', 20).unique();
    table.string('author', 255);
    table.string('publisher', 255);
    table.date('publication_date');
    table.text('description');
    table.uuid('category_id').references('id').inTable('library_categories').onDelete('SET NULL');
    table.enum('item_type', ['book', 'ebook', 'journal', 'magazine', 'video', 'audio', 'other']).defaultTo('ebook');
    table.enum('format', ['physical', 'digital', 'both']).defaultTo('physical');
    table.string('language', 50).defaultTo('en');
    table.integer('total_copies').defaultTo(1);
    table.integer('available_copies').defaultTo(1);
    table.string('cover_image_url', 500);
    table.string('file_url', 500); // For digital items
    table.integer('file_size'); // In bytes
    table.string('location', 100); // Physical location (shelf, room, etc.)
    table.text('tags'); // JSON array of tags
    table.enum('status', ['available', 'unavailable', 'maintenance', 'archived']).defaultTo('available');
    table.integer('pages');
    table.string('edition', 50);
    table.decimal('price', 10, 2);
    table.boolean('is_featured').defaultTo(false);
    table.integer('view_count').defaultTo(0);
    table.integer('download_count').defaultTo(0);
    table.uuid('added_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index('title');
    table.index('isbn');
    table.index('author');
    table.index('category_id');
    table.index('item_type');
    table.index('status');
    table.index('is_featured');
  });

  // 3. Library Borrowing table
  await knex.schema.createTable('library_borrowing', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('item_id').references('id').inTable('library_items').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('borrowed_at').defaultTo(knex.fn.now());
    table.timestamp('due_date').notNullable();
    table.timestamp('returned_at');
    table.enum('status', ['borrowed', 'returned', 'overdue', 'lost']).defaultTo('borrowed');
    table.text('notes');
    table.decimal('fine_amount', 10, 2).defaultTo(0);
    table.boolean('fine_paid').defaultTo(false);
    table.uuid('issued_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('received_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index('item_id');
    table.index('user_id');
    table.index('status');
    table.index('due_date');
    table.index(['item_id', 'user_id']);
  });

  // 4. Library Reservations table
  await knex.schema.createTable('library_reservations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('item_id').references('id').inTable('library_items').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('reserved_at').defaultTo(knex.fn.now());
    table.timestamp('expires_at').notNullable();
    table.enum('status', ['active', 'fulfilled', 'expired', 'cancelled']).defaultTo('active');
    table.integer('queue_position');
    table.text('notes');
    table.timestamp('notified_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index('item_id');
    table.index('user_id');
    table.index('status');
    table.index('expires_at');
  });

  // 5. Library Reviews table
  await knex.schema.createTable('library_reviews', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('item_id').references('id').inTable('library_items').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('rating').notNullable().checkBetween([1, 5]);
    table.text('review');
    table.boolean('is_approved').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.unique(['item_id', 'user_id']);
    table.index('item_id');
    table.index('user_id');
    table.index('is_approved');
  });

  // 6. Library Reading Lists table
  await knex.schema.createTable('library_reading_lists', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.text('description');
    table.boolean('is_public').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index('user_id');
    table.index('is_public');
  });

  // 7. Library Reading List Items table (junction)
  await knex.schema.createTable('library_reading_list_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('reading_list_id').references('id').inTable('library_reading_lists').onDelete('CASCADE');
    table.uuid('item_id').references('id').inTable('library_items').onDelete('CASCADE');
    table.integer('sort_order').defaultTo(0);
    table.text('notes');
    table.timestamp('added_at').defaultTo(knex.fn.now());
    
    table.unique(['reading_list_id', 'item_id']);
    table.index('reading_list_id');
    table.index('item_id');
  });

  // 8. Library Activity Log table
  await knex.schema.createTable('library_activity_log', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('item_id').references('id').inTable('library_items').onDelete('SET NULL');
    table.enum('action', [
      'view', 'download', 'borrow', 'return', 'reserve', 
      'cancel_reservation', 'review', 'add_to_list', 'remove_from_list'
    ]).notNullable();
    table.text('details');
    table.string('ip_address', 45);
    table.string('user_agent', 500);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index('user_id');
    table.index('item_id');
    table.index('action');
    table.index('created_at');
  });

  console.log('✓ Library management tables created successfully');
};

exports.down = async function(knex) {
  // Drop tables in reverse order due to foreign key constraints
  await knex.schema.dropTableIfExists('library_activity_log');
  await knex.schema.dropTableIfExists('library_reading_list_items');
  await knex.schema.dropTableIfExists('library_reading_lists');
  await knex.schema.dropTableIfExists('library_reviews');
  await knex.schema.dropTableIfExists('library_reservations');
  await knex.schema.dropTableIfExists('library_borrowing');
  await knex.schema.dropTableIfExists('library_items');
  await knex.schema.dropTableIfExists('library_categories');
  
  console.log('✓ Library management tables dropped successfully');
};
