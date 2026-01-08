/**
 * Migration: Create Documents and Library Management
 * Creates document management and library system tables
 */

exports.up = async function(knex) {
  // Create document_folders table
  await knex.schema.createTable('document_folders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('parent_folder_id').references('id').inTable('document_folders').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.text('description');
    table.timestamp('created_at').defaultTo(new Date()
    table.timestamp('updated_at').defaultTo(new Date()
    table.timestamp('deleted_at');

    table.unique(['user_id', 'parent_folder_id', 'name'], { indexName: 'document_folders_user_id_parent_folder_id_name_unique' });
    table.index('deleted_at', 'document_folders_deleted_at_index');
    table.index('parent_folder_id', 'document_folders_parent_folder_id_index');
    table.index('user_id', 'document_folders_user_id_index');
  });

  // Create documents table
  await knex.schema.createTable('documents', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('folder_id').references('id').inTable('document_folders').onDelete('SET NULL');
    table.string('title', 255).notNullable();
    table.text('description');
    table.text('file_url').notNullable();
    table.string('file_name', 255).notNullable();
    table.string('file_type', 50).notNullable();
    table.bigInteger('file_size').notNullable();
    table.string('mime_type', 100);
    table.specificType('tags', 'text[]');
    table.integer('version').defaultTo(1);
    table.boolean('is_public').defaultTo(false);
    table.integer('download_count').defaultTo(0);
    table.integer('view_count').defaultTo(0);
    table.timestamp('created_at').defaultTo(new Date()
    table.timestamp('updated_at').defaultTo(new Date()
    table.timestamp('deleted_at');

    table.index('created_at', 'documents_created_at_index');
    table.index('deleted_at', 'documents_deleted_at_index');
    table.index('file_type', 'documents_file_type_index');
    table.index('folder_id', 'documents_folder_id_index');
    table.index('is_public', 'documents_is_public_index');
    table.index('user_id', 'documents_user_id_index');
  });

  // Create document_versions table
  await knex.schema.createTable('document_versions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('document_id').notNullable().references('id').inTable('documents').onDelete('CASCADE');
    table.integer('version_number').notNullable();
    table.text('file_url').notNullable();
    table.bigInteger('file_size').notNullable();
    table.uuid('uploaded_by').notNullable().references('id').inTable('users');
    table.text('change_notes');
    table.timestamp('created_at').defaultTo(new Date()

    table.index('document_id', 'document_versions_document_id_index');
    table.index('uploaded_by', 'document_versions_uploaded_by_index');
  });

  // Create document_shares table
  await knex.schema.createTable('document_shares', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('document_id').notNullable().references('id').inTable('documents').onDelete('CASCADE');
    table.uuid('shared_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('shared_with_user_id').references('id').inTable('users').onDelete('CASCADE');
    table.text('share_type').notNullable()
      .checkIn(['user', 'link', 'password', 'public']);
    table.text('permission_level').defaultTo('view')
      .checkIn(['view', 'edit', 'owner']);
    table.string('access_token', 255).unique();
    table.string('password_hash', 255);
    table.timestamp('expires_at');
    table.integer('max_downloads');
    table.integer('download_count').defaultTo(0);
    table.string('recipient_email', 255);
    table.timestamp('created_at').defaultTo(new Date()

    table.index('access_token', 'document_shares_access_token_index');
    table.index('document_id', 'document_shares_document_id_index');
    table.index('recipient_email', 'document_shares_recipient_email_index');
    table.index('share_type', 'document_shares_share_type_index');
    table.index('shared_by', 'document_shares_shared_by_index');
    table.index('shared_with_user_id', 'document_shares_shared_with_user_id_index');
  });

  // Create library_items table
  await knex.schema.createTable('library_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title', 255).notNullable();
    table.string('isbn', 20).unique();
    table.string('author', 255);
    table.string('publisher', 255);
    table.date('publication_date');
    table.text('description');
    table.uuid('category_id').references('id').inTable('library_categories').onDelete('SET NULL');
    table.text('item_type').defaultTo('book')
      .checkIn(['book', 'ebook', 'journal', 'magazine', 'video', 'audio', 'other']);
    table.text('format').defaultTo('physical')
      .checkIn(['physical', 'digital', 'both']);
    table.string('language', 50).defaultTo('en');
    table.integer('total_copies').defaultTo(1);
    table.integer('available_copies').defaultTo(1);
    table.string('cover_image_url', 500);
    table.string('file_url', 500);
    table.integer('file_size');
    table.string('location', 100);
    table.text('tags');
    table.text('status').defaultTo('available')
      .checkIn(['available', 'unavailable', 'maintenance', 'archived']);
    table.integer('pages');
    table.string('edition', 50);
    table.boolean('is_featured').defaultTo(false);
    table.integer('view_count').defaultTo(0);
    table.integer('download_count').defaultTo(0);
    table.uuid('added_by').references('id').inTable('users').onDelete('SET NULL');
    table.string('thumbnail_url', 500);
    table.string('file_mime_type', 100);
    table.integer('duration');
    table.timestamp('created_at').defaultTo(new Date()
    table.timestamp('updated_at').defaultTo(new Date()

    table.index('author', 'library_items_author_index');
    table.index('category_id', 'library_items_category_id_index');
    table.index('is_featured', 'library_items_is_featured_index');
    table.index('isbn', 'library_items_isbn_index');
    table.index('item_type', 'library_items_item_type_index');
    table.index('status', 'library_items_status_index');
    table.index('title', 'library_items_title_index');
  });

  // Create library_borrowing table
  await knex.schema.createTable('library_borrowing', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('item_id').references('id').inTable('library_items').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('borrowed_at').defaultTo(new Date()
    table.timestamp('due_date').notNullable();
    table.timestamp('returned_at');
    table.text('status').defaultTo('borrowed')
      .checkIn(['borrowed', 'returned', 'overdue', 'lost']);
    table.text('notes');
    table.decimal('fine_amount', 10, 2).defaultTo(0);
    table.boolean('fine_paid').defaultTo(false);
    table.uuid('issued_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('received_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(new Date()
    table.timestamp('updated_at').defaultTo(new Date()

    table.index('due_date', 'library_borrowing_due_date_index');
    table.index('item_id', 'library_borrowing_item_id_index');
    table.index(['item_id', 'user_id'], 'library_borrowing_item_id_user_id_index');
    table.index('status', 'library_borrowing_status_index');
    table.index('user_id', 'library_borrowing_user_id_index');
  });

  // Create library_reservations table
  await knex.schema.createTable('library_reservations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('item_id').references('id').inTable('library_items').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('reserved_at').defaultTo(new Date()
    table.timestamp('expires_at').notNullable();
    table.text('status').defaultTo('active')
      .checkIn(['active', 'fulfilled', 'expired', 'cancelled']);
    table.integer('queue_position');
    table.text('notes');
    table.timestamp('notified_at');
    table.timestamp('created_at').defaultTo(new Date()
    table.timestamp('updated_at').defaultTo(new Date()

    table.index('expires_at', 'library_reservations_expires_at_index');
    table.index('item_id', 'library_reservations_item_id_index');
    table.index('status', 'library_reservations_status_index');
    table.index('user_id', 'library_reservations_user_id_index');
  });

  // Create library_reviews table
  await knex.schema.createTable('library_reviews', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('item_id').references('id').inTable('library_items').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('rating').notNullable().checkBetween([1, 5]);
    table.text('review');
    table.boolean('is_approved').defaultTo(false);
    table.timestamp('created_at').defaultTo(new Date()
    table.timestamp('updated_at').defaultTo(new Date()

    table.unique(['item_id', 'user_id'], { indexName: 'library_reviews_item_id_user_id_unique' });
    table.index('is_approved', 'library_reviews_is_approved_index');
    table.index('item_id', 'library_reviews_item_id_index');
    table.index('user_id', 'library_reviews_user_id_index');
  });

  // Create library_reading_lists table
  await knex.schema.createTable('library_reading_lists', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.text('description');
    table.boolean('is_public').defaultTo(false);
    table.timestamp('created_at').defaultTo(new Date()
    table.timestamp('updated_at').defaultTo(new Date()

    table.index('is_public', 'library_reading_lists_is_public_index');
    table.index('user_id', 'library_reading_lists_user_id_index');
  });

  // Create library_reading_list_items table
  await knex.schema.createTable('library_reading_list_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('reading_list_id').references('id').inTable('library_reading_lists').onDelete('CASCADE');
    table.uuid('item_id').references('id').inTable('library_items').onDelete('CASCADE');
    table.integer('sort_order').defaultTo(0);
    table.text('notes');
    table.timestamp('added_at').defaultTo(new Date()

    table.unique(['reading_list_id', 'item_id'], { indexName: 'library_reading_list_items_reading_list_id_item_id_unique' });
    table.index('item_id', 'library_reading_list_items_item_id_index');
    table.index('reading_list_id', 'library_reading_list_items_reading_list_id_index');
  });

  // Create library_activity_log table
  await knex.schema.createTable('library_activity_log', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('item_id').references('id').inTable('library_items').onDelete('SET NULL');
    table.text('action').notNullable()
      .checkIn(['view', 'download', 'borrow', 'return', 'reserve', 'cancel_reservation', 'review', 'add_to_list', 'remove_from_list']);
    table.text('details');
    table.string('ip_address', 45);
    table.string('user_agent', 500);
    table.timestamp('created_at').defaultTo(new Date()

    table.index('action', 'library_activity_log_action_index');
    table.index('created_at', 'library_activity_log_created_at_index');
    table.index('item_id', 'library_activity_log_item_id_index');
    table.index('user_id', 'library_activity_log_user_id_index');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('library_activity_log');
  await knex.schema.dropTableIfExists('library_reading_list_items');
  await knex.schema.dropTableIfExists('library_reading_lists');
  await knex.schema.dropTableIfExists('library_reviews');
  await knex.schema.dropTableIfExists('library_reservations');
  await knex.schema.dropTableIfExists('library_borrowing');
  await knex.schema.dropTableIfExists('library_items');
  await knex.schema.dropTableIfExists('document_shares');
  await knex.schema.dropTableIfExists('document_versions');
  await knex.schema.dropTableIfExists('documents');
  await knex.schema.dropTableIfExists('document_folders');
};
