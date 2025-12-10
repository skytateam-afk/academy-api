/**
 * Migration: Create Enrollments and Progress Tracking
 * Creates enrollment, progress tracking, and certificate tables
 */

exports.up = async function(knex) {
  // Create transactions table (needed for enrollments)
  await knex.schema.createTable('transactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('course_id').references('id').inTable('courses').onDelete('CASCADE');
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency', 3).defaultTo('USD');
    table.string('payment_method', 20)
      .checkIn(['stripe', 'paystack', 'free']);
    table.string('payment_provider', 20);
    table.string('provider_transaction_id', 255);
    table.string('provider_reference', 255);
    table.string('status', 20).defaultTo('pending')
      .checkIn(['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled']);
    table.jsonb('payment_metadata');
    table.timestamp('paid_at');
    table.timestamp('refunded_at');
    table.text('refund_reason');
    table.uuid('order_id');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.index('course_id', 'transactions_course_id_index');
    table.index('created_at', 'transactions_created_at_index');
    table.index('order_id', 'transactions_order_id_index');
    table.index('status', 'transactions_status_index');
    table.index('user_id', 'transactions_user_id_index');
  });

  // Create enrollments table
  await knex.schema.createTable('enrollments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('course_id').notNullable().references('id').inTable('courses').onDelete('CASCADE');
    table.timestamp('enrolled_at').defaultTo(knex.fn.now());
    table.timestamp('started_at');
    table.timestamp('completed_at');
    table.decimal('progress_percent', 5, 2).defaultTo(0.00);
    table.timestamp('last_accessed_at');
    table.timestamp('certificate_issued_at');
    table.text('certificate_url');
    table.string('status', 20).defaultTo('active')
      .checkIn(['active', 'completed', 'dropped', 'suspended']);
    table.uuid('transaction_id').references('id').inTable('transactions').onDelete('SET NULL');
    table.string('enrollment_type', 20).defaultTo('paid')
      .checkIn(['free', 'paid', 'gifted', 'admin']);

    table.unique(['user_id', 'course_id'], { indexName: 'unique_user_course_enrollment' });
    table.index('course_id', 'idx_enrollments_course_id');
    table.index('status', 'idx_enrollments_status');
    table.index('transaction_id', 'enrollments_transaction_id_index');
    table.index('user_id', 'idx_enrollments_user_id');
  });

  // Add foreign keys to quiz_attempts and assignment_submissions
  await knex.schema.alterTable('quiz_attempts', (table) => {
    table.foreign('enrollment_id').references('id').inTable('enrollments').onDelete('CASCADE');
  });

  await knex.schema.alterTable('assignment_submissions', (table) => {
    table.foreign('enrollment_id').references('id').inTable('enrollments').onDelete('CASCADE');
  });

  // Create pathway_enrollments table
  await knex.schema.createTable('pathway_enrollments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('pathway_id').notNullable().references('id').inTable('pathways').onDelete('CASCADE');
    table.uuid('transaction_id').references('id').inTable('transactions').onDelete('SET NULL');
    table.text('enrollment_type').defaultTo('paid')
      .checkIn(['free', 'paid', 'gifted', 'admin']);
    table.decimal('progress_percent', 5, 2).defaultTo(0);
    table.integer('completed_courses').defaultTo(0);
    table.integer('total_courses').defaultTo(0);
    table.timestamp('enrolled_at').defaultTo(knex.fn.now());
    table.timestamp('started_at');
    table.timestamp('completed_at');
    table.timestamp('last_accessed_at');
    table.timestamp('certificate_issued_at');
    table.string('certificate_url', 255);
    table.text('status').defaultTo('active')
      .checkIn(['active', 'completed', 'dropped', 'suspended']);
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.unique(['user_id', 'pathway_id'], { indexName: 'pathway_enrollments_user_id_pathway_id_unique' });
    table.index('enrolled_at', 'pathway_enrollments_enrolled_at_index');
    table.index('pathway_id', 'pathway_enrollments_pathway_id_index');
    table.index('status', 'pathway_enrollments_status_index');
    table.index('user_id', 'pathway_enrollments_user_id_index');
  });

  // Create pathway_progress table
  await knex.schema.createTable('pathway_progress', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('pathway_enrollment_id').notNullable().references('id').inTable('pathway_enrollments').onDelete('CASCADE');
    table.uuid('course_id').notNullable().references('id').inTable('courses').onDelete('CASCADE');
    table.uuid('enrollment_id').references('id').inTable('enrollments').onDelete('SET NULL');
    table.boolean('is_started').defaultTo(false);
    table.boolean('is_completed').defaultTo(false);
    table.decimal('progress_percent', 5, 2).defaultTo(0);
    table.timestamp('started_at');
    table.timestamp('completed_at');
    table.timestamp('last_accessed_at');
    table.decimal('quiz_average', 5, 2);
    table.decimal('assignment_average', 5, 2);
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.unique(['pathway_enrollment_id', 'course_id'], { indexName: 'pathway_progress_pathway_enrollment_id_course_id_unique' });
    table.index('course_id', 'pathway_progress_course_id_index');
    table.index('is_completed', 'pathway_progress_is_completed_index');
    table.index('pathway_enrollment_id', 'pathway_progress_pathway_enrollment_id_index');
  });

  // Create lesson_progress table
  await knex.schema.createTable('lesson_progress', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('lesson_id').notNullable().references('id').inTable('lessons').onDelete('CASCADE');
    table.uuid('enrollment_id').notNullable().references('id').inTable('enrollments').onDelete('CASCADE');
    table.uuid('course_id').notNullable().references('id').inTable('courses').onDelete('CASCADE');
    table.timestamp('started_at').defaultTo(knex.fn.now());
    table.timestamp('completed_at');
    table.integer('last_position').defaultTo(0);
    table.integer('watch_time_seconds').defaultTo(0);
    table.boolean('is_completed').defaultTo(false);
    table.integer('completed_modules_count').defaultTo(0);
    table.integer('total_modules_count').defaultTo(0);
    table.integer('completion_percentage').defaultTo(0);

    table.unique(['user_id', 'lesson_id'], { indexName: 'unique_user_lesson_progress' });
    table.index('enrollment_id', 'idx_lesson_progress_enrollment_id');
    table.index('user_id', 'idx_lesson_progress_user_id');
  });

  // Create module_progress table
  await knex.schema.createTable('module_progress', (table) => {
    table.increments('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('module_id').notNullable().references('id').inTable('lesson_modules').onDelete('CASCADE');
    table.uuid('course_id').notNullable().references('id').inTable('courses').onDelete('CASCADE');
    table.boolean('is_completed').defaultTo(false);
    table.integer('completion_percentage').defaultTo(0);
    table.integer('time_spent_seconds').defaultTo(0);
    table.timestamp('last_accessed_at');
    table.timestamp('completed_at');
    table.integer('video_progress_seconds');
    table.integer('video_duration_seconds');
    table.integer('quiz_attempts').defaultTo(0);
    table.integer('quiz_best_score');
    table.integer('quiz_score');
    table.boolean('quiz_passed').defaultTo(false);
    table.jsonb('completion_data');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.unique(['user_id', 'module_id'], { indexName: 'module_progress_user_id_module_id_unique' });
    table.index('is_completed', 'module_progress_is_completed_index');
    table.index('module_id', 'module_progress_module_id_index');
    table.index(['user_id', 'course_id'], 'module_progress_user_id_course_id_index');
  });

  // Create course_reviews table
  await knex.schema.createTable('course_reviews', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('course_id').notNullable().references('id').inTable('courses').onDelete('CASCADE');
    table.uuid('enrollment_id').notNullable().references('id').inTable('enrollments').onDelete('CASCADE');
    table.integer('rating').notNullable().checkBetween([1, 5]);
    table.text('review_text');
    table.boolean('is_published').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.unique(['user_id', 'course_id'], { indexName: 'unique_user_course_review' });
  });

  // Create certificates table
  await knex.schema.createTable('certificates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('course_id').notNullable().references('id').inTable('courses').onDelete('CASCADE');
    table.string('certificate_number', 255).notNullable().unique();
    table.timestamp('issued_at').notNullable();
    table.jsonb('certificate_data').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.unique(['user_id', 'course_id'], { indexName: 'certificates_user_id_course_id_unique' });
    table.index('certificate_number', 'certificates_certificate_number_index');
    table.index('course_id', 'certificates_course_id_index');
    table.index('user_id', 'certificates_user_id_index');
  });

  // Create payment_providers table
  await knex.schema.createTable('payment_providers', (table) => {
    table.increments('id').primary();
    table.string('provider_name', 255).notNullable().unique();
    table.string('provider_display_name', 255).notNullable();
    table.text('secret_key_encrypted').notNullable();
    table.text('public_key_encrypted').notNullable();
    table.text('webhook_secret_encrypted');
    table.boolean('is_active').defaultTo(false).notNullable();
    table.jsonb('supported_currencies');
    table.jsonb('configuration');
    table.timestamp('last_tested_at');
    table.string('test_result', 255);
    table.text('error_message');
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.index('is_active', 'payment_providers_is_active_index');
    table.index('provider_name', 'payment_providers_provider_name_index');
  });

  // Create payment_webhooks table
  await knex.schema.createTable('payment_webhooks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('provider', 20).notNullable();
    table.string('event_type', 100).notNullable();
    table.jsonb('payload').notNullable();
    table.boolean('processed').defaultTo(false);
    table.timestamp('processed_at');
    table.text('error_message');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('payment_webhooks');
  await knex.schema.dropTableIfExists('payment_providers');
  await knex.schema.dropTableIfExists('certificates');
  await knex.schema.dropTableIfExists('course_reviews');
  await knex.schema.dropTableIfExists('module_progress');
  await knex.schema.dropTableIfExists('lesson_progress');
  await knex.schema.dropTableIfExists('pathway_progress');
  await knex.schema.dropTableIfExists('pathway_enrollments');
  
  // Remove foreign keys from quiz_attempts and assignment_submissions
  await knex.schema.alterTable('assignment_submissions', (table) => {
    table.dropForeign('enrollment_id');
  });
  await knex.schema.alterTable('quiz_attempts', (table) => {
    table.dropForeign('enrollment_id');
  });
  
  await knex.schema.dropTableIfExists('enrollments');
  await knex.schema.dropTableIfExists('transactions');
};
