/**
 * Migration: Create Courses and Pathways
 * Creates course, pathway, and related tables
 */

exports.up = async function(knex) {
  // Create system_tags table
  await knex.schema.createTable('system_tags', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('tag_key', 100).notNullable();
    table.string('tag_value', 255).notNullable();
    table.text('description');
    table.string('tag_type', 20).defaultTo('custom')
      .checkIn(['system', 'custom', 'auto']);
    table.uuid('category_id').references('id').inTable('tag_categories').onDelete('SET NULL');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(new Date());
    table.timestamp('updated_at').defaultTo(new Date());

    table.unique(['tag_key', 'tag_value'], { indexName: 'unique_tag_key_value' });
    table.index('created_by', 'idx_system_tags_created_by');
    table.index('tag_key', 'idx_system_tags_key');
    table.index(['tag_key', 'tag_value'], 'idx_system_tags_key_value');
    table.index('tag_value', 'idx_system_tags_value');
  });

  // Create courses table
  await knex.schema.createTable('courses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('title', 255).notNullable();
    table.string('slug', 255).notNullable().unique();
    table.text('description');
    table.text('short_description');
    table.text('thumbnail_url');
    table.text('preview_video_url');
    table.uuid('category_id').references('id').inTable('categories').onDelete('SET NULL');
    table.uuid('instructor_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('level', 20).checkIn(['beginner', 'intermediate', 'advanced', 'all']);
    table.string('language', 10).defaultTo('en');
    table.decimal('duration_hours', 10, 2);
    table.decimal('price', 10, 2).defaultTo(0.00);
    table.string('currency', 3).defaultTo('USD');
    table.boolean('is_published').defaultTo(false);
    table.boolean('is_featured').defaultTo(false);
    table.timestamp('published_at');
    table.integer('enrollment_limit');
    table.integer('enrollment_count').defaultTo(0);
    table.decimal('rating_average', 3, 2).defaultTo(0.00);
    table.integer('rating_count').defaultTo(0);
    table.integer('view_count').defaultTo(0);
    table.integer('completion_count').defaultTo(0);
    table.boolean('is_certification').defaultTo(false);
    table.uuid('subscription_tier_id').references('id').inTable('subscription_tiers').onDelete('SET NULL');
    table.jsonb('metadata');
    table.timestamp('created_at').defaultTo(new Date());
    table.timestamp('updated_at').defaultTo(new Date());

    table.index('category_id', 'idx_courses_category_id');
    table.index('created_at', 'idx_courses_created_at');
    table.index('instructor_id', 'idx_courses_instructor_id');
    table.index('is_published', 'idx_courses_is_published');
    table.index('slug', 'idx_courses_slug');
    table.index('subscription_tier_id', 'idx_courses_subscription_tier_id');
  });

  // Create course_tags table
  await knex.schema.createTable('course_tags', (table) => {
    table.uuid('course_id').notNullable().references('id').inTable('courses').onDelete('CASCADE');
    table.uuid('tag_id').notNullable().references('id').inTable('tags').onDelete('CASCADE');

    table.primary(['course_id', 'tag_id']);
  });

  // Create course_prerequisites table
  await knex.schema.createTable('course_prerequisites', (table) => {
    table.uuid('course_id').notNullable().references('id').inTable('courses').onDelete('CASCADE');
    table.uuid('prerequisite_course_id').notNullable().references('id').inTable('courses').onDelete('CASCADE');

    table.primary(['course_id', 'prerequisite_course_id']);
    table.check('course_id <> prerequisite_course_id', {}, 'no_self_prerequisite');
  });

  // Create pathways table
  await knex.schema.createTable('pathways', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('title', 255).notNullable();
    table.string('slug', 255).notNullable().unique();
    table.text('description');
    table.text('short_description');
    table.text('thumbnail_url');
    table.text('banner_url');
    table.string('career_focus', 100);
    table.uuid('category_id').references('id').inTable('categories').onDelete('SET NULL');
    table.text('level').defaultTo('all').checkIn(['beginner', 'intermediate', 'advanced', 'all']);
    table.decimal('estimated_duration_hours', 10, 2);
    table.integer('course_count').defaultTo(0);
    table.decimal('price', 10, 2).defaultTo(0);
    table.string('currency', 3).defaultTo('USD');
    table.boolean('has_certification').defaultTo(false);
    table.text('certification_criteria');
    table.boolean('is_published').defaultTo(false);
    table.boolean('is_featured').defaultTo(false);
    table.timestamp('published_at');
    table.integer('enrollment_limit');
    table.integer('enrollment_count').defaultTo(0);
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.decimal('rating_average', 3, 2).defaultTo(0);
    table.integer('rating_count').defaultTo(0);
    table.integer('completion_count').defaultTo(0);
    table.uuid('subscription_tier_id').references('id').inTable('subscription_tiers').onDelete('SET NULL');
    table.jsonb('metadata');
    table.timestamp('created_at').defaultTo(new Date()).notNullable();
    table.timestamp('updated_at').defaultTo(new Date()).notNullable();

    table.index('career_focus', 'pathways_career_focus_index');
    table.index('category_id', 'pathways_category_id_index');
    table.index('created_by', 'pathways_created_by_index');
    table.index('is_published', 'pathways_is_published_index');
    table.index('slug', 'pathways_slug_index');
    table.index('subscription_tier_id', 'idx_pathways_subscription_tier_id');
  });

  // Create pathway_courses table
  await knex.schema.createTable('pathway_courses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('pathway_id').notNullable().references('id').inTable('pathways').onDelete('CASCADE');
    table.uuid('course_id').notNullable().references('id').inTable('courses').onDelete('CASCADE');
    table.integer('sequence_order').notNullable();
    table.boolean('is_required').defaultTo(true);
    table.text('description');
    table.jsonb('learning_objectives');
    table.uuid('prerequisite_course_id').references('id').inTable('courses').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(new Date()).notNullable();
    table.timestamp('updated_at').defaultTo(new Date()).notNullable();

    table.unique(['pathway_id', 'course_id'], { indexName: 'pathway_courses_pathway_id_course_id_unique' });
    table.index('course_id', 'pathway_courses_course_id_index');
    table.index('pathway_id', 'pathway_courses_pathway_id_index');
    table.index('sequence_order', 'pathway_courses_sequence_order_index');
  });

  // Create pathway_applications table
  await knex.schema.createTable('pathway_applications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('pathway_id').notNullable().references('id').inTable('pathways').onDelete('CASCADE');
    table.text('application_message');
    table.timestamp('applied_at').defaultTo(new Date());
    table.text('status').defaultTo('pending')
      .checkIn(['pending', 'approved', 'rejected', 'cannot_reapply']);
    table.uuid('reviewed_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('reviewed_at');
    table.text('review_notes');
    table.boolean('prevent_reapplication').defaultTo(false);
    table.timestamp('created_at').defaultTo(new Date()).notNullable();
    table.timestamp('updated_at').defaultTo(new Date()).notNullable();

    table.unique(['user_id', 'pathway_id'], { indexName: 'unique_user_pathway_application' });
    table.index('applied_at', 'pathway_applications_applied_at_index');
    table.index('pathway_id', 'pathway_applications_pathway_id_index');
    table.index('status', 'pathway_applications_status_index');
    table.index('user_id', 'pathway_applications_user_id_index');
  });

  // Create announcements table
  await knex.schema.createTable('announcements', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title', 255).notNullable();
    table.text('content').notNullable();
    table.text('type').defaultTo('info')
      .checkIn(['info', 'warning', 'success', 'error']);
    table.integer('priority').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('start_date');
    table.timestamp('end_date');
    table.text('target_audience').defaultTo('all')
      .checkIn(['all', 'students', 'instructors', 'admins']);
    table.boolean('is_dismissible').defaultTo(true);
    table.string('action_label', 100);
    table.string('action_url', 500);
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(new Date()).notNullable();
    table.timestamp('updated_at').defaultTo(new Date()).notNullable();

    table.index(['is_active', 'start_date', 'end_date'], 'announcements_is_active_start_date_end_date_index');
    table.index('priority', 'announcements_priority_index');
    table.index('target_audience', 'announcements_target_audience_index');
  });

  // Create announcement_views table
  await knex.schema.createTable('announcement_views', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('announcement_id').notNullable().references('id').inTable('announcements').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.boolean('is_dismissed').defaultTo(false);
    table.timestamp('viewed_at').defaultTo(new Date());
    table.timestamp('dismissed_at');

    table.unique(['announcement_id', 'user_id'], { indexName: 'announcement_views_announcement_id_user_id_unique' });
    table.index(['announcement_id', 'is_dismissed'], 'announcement_views_announcement_id_is_dismissed_index');
    table.index('user_id', 'announcement_views_user_id_index');
  });

  // Create promotions table
  await knex.schema.createTable('promotions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title', 255).notNullable();
    table.text('content').notNullable();
    table.string('image_url', 500);
    table.text('display_type').defaultTo('popup')
      .checkIn(['popup', 'banner', 'corner']);
    table.integer('priority').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('start_date').notNullable();
    table.timestamp('end_date');
    table.text('target_audience').defaultTo('all')
      .checkIn(['all', 'students', 'instructors', 'admins', 'new_users']);
    table.integer('max_displays_per_user').defaultTo(3);
    table.integer('display_frequency_hours').defaultTo(24);
    table.boolean('requires_action').defaultTo(false);
    table.string('action_label', 100);
    table.string('action_url', 500);
    table.string('discount_code', 100);
    table.json('targeting_rules');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(new Date()).notNullable();
    table.timestamp('updated_at').defaultTo(new Date()).notNullable();

    table.index('display_type', 'promotions_display_type_index');
    table.index(['is_active', 'start_date', 'end_date'], 'promotions_is_active_start_date_end_date_index');
    table.index('priority', 'promotions_priority_index');
    table.index('target_audience', 'promotions_target_audience_index');
  });

  // Create promotion_displays table
  await knex.schema.createTable('promotion_displays', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('promotion_id').notNullable().references('id').inTable('promotions').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('displayed_at').defaultTo(new Date());
    table.boolean('was_clicked').defaultTo(false);
    table.timestamp('clicked_at');
    table.boolean('was_dismissed').defaultTo(false);
    table.timestamp('dismissed_at');

    table.index(['promotion_id', 'displayed_at'], 'promotion_displays_promotion_id_displayed_at_index');
    table.index(['promotion_id', 'user_id'], 'promotion_displays_promotion_id_user_id_index');
    table.index('user_id', 'promotion_displays_user_id_index');
  });

  // Create resource_tags table
  await knex.schema.createTable('resource_tags', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('tag_id').notNullable().references('id').inTable('system_tags').onDelete('CASCADE');
    table.string('resource_type', 50).notNullable();
    table.uuid('resource_id').notNullable();
    table.uuid('tagged_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('tagged_at').defaultTo(new Date());

    table.unique(['resource_type', 'resource_id', 'tag_id'], { indexName: 'unique_resource_tag' });
    table.index(['resource_type', 'resource_id'], 'idx_resource_tags_resource');
    table.index('tag_id', 'idx_resource_tags_tag_id');
    table.index('tagged_by', 'idx_resource_tags_tagged_by');
    table.index('resource_type', 'idx_resource_tags_type');
  });

  // Create contact_submissions table
  await knex.schema.createTable('contact_submissions', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('email', 255).notNullable();
    table.string('phone', 50);
    table.string('subject', 500).notNullable();
    table.text('message').notNullable();
    table.text('status').defaultTo('new')
      .checkIn(['new', 'read', 'replied', 'archived']);
    table.text('admin_notes');
    table.uuid('replied_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('replied_at');
    table.string('ip_address', 45);
    table.string('user_agent', 500);
    table.timestamp('created_at').defaultTo(new Date()).notNullable();
    table.timestamp('updated_at').defaultTo(new Date()).notNullable();

    table.index('created_at', 'contact_submissions_created_at_index');
    table.index('email', 'contact_submissions_email_index');
    table.index('status', 'contact_submissions_status_index');
  });

  // Create user_wishlist table
  await knex.schema.createTable('user_wishlist', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('item_type').notNullable()
      .checkIn(['course', 'library_item', 'shop_product']);
    table.uuid('item_id').notNullable();
    table.text('notes');
    table.timestamp('created_at').defaultTo(new Date());

    table.unique(['user_id', 'item_type', 'item_id'], { indexName: 'user_wishlist_user_id_item_type_item_id_unique' });
    table.index('created_at', 'user_wishlist_created_at_index');
    table.index('user_id', 'user_wishlist_user_id_index');
    table.index(['user_id', 'item_type'], 'user_wishlist_user_id_item_type_index');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('user_wishlist');
  await knex.schema.dropTableIfExists('contact_submissions');
  await knex.schema.dropTableIfExists('resource_tags');
  await knex.schema.dropTableIfExists('promotion_displays');
  await knex.schema.dropTableIfExists('promotions');
  await knex.schema.dropTableIfExists('announcement_views');
  await knex.schema.dropTableIfExists('announcements');
  await knex.schema.dropTableIfExists('pathway_applications');
  await knex.schema.dropTableIfExists('pathway_courses');
  await knex.schema.dropTableIfExists('pathways');
  await knex.schema.dropTableIfExists('course_prerequisites');
  await knex.schema.dropTableIfExists('course_tags');
  await knex.schema.dropTableIfExists('courses');
  await knex.schema.dropTableIfExists('system_tags');
};
