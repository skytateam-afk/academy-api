/**
 * Migration: Create Base Tables
 * Creates foundational tables with no foreign key dependencies
 */

exports.up = async function(knex) {
  // Enable uuid extension
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  // Create roles table
  await knex.schema.createTable('roles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 50).notNullable().unique();
    table.text('description');
    table.boolean('is_system_role').defaultTo(false);
    table.timestamp('created_at').defaultTo(new Date());
    table.timestamp('updated_at').defaultTo(new Date());
  });

  // Create permissions table
  await knex.schema.createTable('permissions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 100).notNullable().unique();
    table.string('resource', 50).notNullable();
    table.string('action', 50).notNullable();
    table.text('description');
    table.timestamp('created_at').defaultTo(new Date());
    table.unique(['resource', 'action'], { indexName: 'unique_permission' });
  });

  // Create tag_categories table
  await knex.schema.createTable('tag_categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 100).notNullable().unique();
    table.text('description');
    table.string('color', 7);
    table.string('icon', 50);
    table.timestamp('created_at').defaultTo(new Date());
  });

  // Create tags table
  await knex.schema.createTable('tags', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 50).notNullable().unique();
    table.string('slug', 50).notNullable().unique();
    table.timestamp('created_at').defaultTo(new Date());
  });

  // Create parents table
  await knex.schema.createTable('parents', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('first_name', 255).notNullable();
    table.string('last_name', 255).notNullable();
    table.string('email', 255).notNullable().unique();
    table.string('phone', 255);
    table.text('address');
    table.timestamp('created_at').defaultTo(new Date()).notNullable();
    table.timestamp('updated_at').defaultTo(new Date()).notNullable();
  });

  // Create categories table
  await knex.schema.createTable('categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 100).notNullable().unique();
    table.string('slug', 100).notNullable().unique();
    table.text('description');
    table.uuid('parent_id').references('id').inTable('categories').onDelete('SET NULL');
    table.text('icon_url');
    table.integer('display_order').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(new Date())
    table.timestamp('updated_at').defaultTo(new Date())

    table.index('parent_id', 'idx_categories_parent_id');
  });

  // Create subscription_tiers table
  await knex.schema.createTable('subscription_tiers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('slug', 255).notNullable().unique();
    table.string('name', 255).notNullable();
    table.text('description');
    table.text('short_description');
    table.decimal('price', 10, 2).notNullable();
    table.string('currency', 3).defaultTo('USD');
    table.integer('billing_cycle_months').defaultTo(1);
    table.integer('billing_cycle_days').defaultTo(30);
    table.jsonb('features');
    table.boolean('is_popular').defaultTo(false);
    table.integer('max_users').defaultTo(-1);
    table.boolean('is_active').defaultTo(true);
    table.integer('sort_order').defaultTo(0);
    table.string('stripe_price_id', 255);
    table.timestamp('created_at').defaultTo(new Date());
    table.timestamp('updated_at').defaultTo(new Date());

    table.index(['is_active', 'sort_order'], 'subscription_tiers_is_active_sort_order_index');
    table.index('slug', 'subscription_tiers_slug_index');
  });

  // Create institution_settings table
  await knex.schema.createTable('institution_settings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()')).unique();
    table.string('organization_name', 255).defaultTo('Learning Management System').notNullable();
    table.text('organization_description');
    table.string('tagline', 500);
    table.string('contact_email', 255);
    table.string('contact_phone', 50);
    table.string('support_email', 255);
    table.text('address');
    table.string('website', 500);
    table.string('facebook_url', 500);
    table.string('twitter_url', 500);
    table.string('linkedin_url', 500);
    table.string('instagram_url', 500);
    table.string('youtube_url', 500);
    table.string('logo_url', 1000);
    table.string('logo_dark_url', 1000);
    table.string('favicon_url', 1000);
    table.string('banner_url', 1000);
    table.string('primary_color', 7).defaultTo('#22c55e');
    table.string('secondary_color', 7).defaultTo('#3b82f6');
    table.string('accent_color', 7).defaultTo('#8b5cf6');
    table.string('font_family', 100).defaultTo('Inter');
    table.integer('max_upload_size').defaultTo(10485760);
    table.boolean('allow_public_registration').defaultTo(true);
    table.boolean('require_email_verification').defaultTo(true);
    table.boolean('enable_course_reviews').defaultTo(true);
    table.boolean('enable_certificates').defaultTo(true);
    table.text('footer_text');
    table.text('copyright_text');
    table.text('terms_url');
    table.text('privacy_url');
    table.string('currency_code', 3).defaultTo('NGN');
    table.string('currency_symbol', 10).defaultTo('₦');
    table.string('currency_position', 10).defaultTo('before');
    table.timestamp('created_at').defaultTo(new Date()).notNullable();
    table.timestamp('updated_at').defaultTo(new Date()).notNullable();
  });

  // Create xp_activities table
  await knex.schema.createTable('xp_activities', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('activity_type', 50).notNullable().unique();
    table.integer('xp_value').notNullable();
    table.text('description');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(new Date());
    table.timestamp('updated_at').defaultTo(new Date());
  });

  // Create xp_levels table
  await knex.schema.createTable('xp_levels', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.text('description');
    table.string('badge_icon', 255);
    table.string('badge_image_url', 255);
    table.string('badge_color', 255).defaultTo('#3B82F6');
    table.integer('min_xp').defaultTo(0).notNullable();
    table.integer('max_xp');
    table.integer('level_number').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.integer('display_order').defaultTo(0).notNullable();
    table.jsonb('metadata');
    table.timestamp('created_at').defaultTo(new Date());
    table.timestamp('updated_at').defaultTo(new Date());

    table.index('is_active', 'xp_levels_is_active_index');
    table.index('level_number', 'xp_levels_level_number_index');
    table.index('min_xp', 'xp_levels_min_xp_index');
  });

  // Create subjects table
  await knex.schema.createTable('subjects', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.string('code', 50).notNullable().unique();
    table.text('category').defaultTo('general')
      .checkIn(['science', 'arts', 'commercial', 'general', 'vocational', 'language', 'humanities', 'other']);
    table.text('description');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(new Date()).notNullable();
    table.timestamp('updated_at').defaultTo(new Date()).notNullable();
  });

  // Create grading_scales table
  await knex.schema.createTable('grading_scales', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.jsonb('grade_config').notNullable();
    table.boolean('is_default').defaultTo(false);
    table.uuid('created_by');
    table.timestamp('created_at').defaultTo(new Date()).notNullable();
    table.timestamp('updated_at').defaultTo(new Date()).notNullable();
  });

  // Create subject_groups table
  await knex.schema.createTable('subject_groups', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.text('description');
    table.string('academic_session', 50);
    table.string('term', 20);
    table.uuid('created_by');
    table.timestamp('created_at').defaultTo(new Date());
    table.timestamp('updated_at').defaultTo(new Date());
  });

  // Create jobs table
  await knex.schema.createTable('jobs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title', 255).notNullable();
    table.text('description').notNullable();
    table.text('short_description');
    table.string('location', 255);
    table.text('type').defaultTo('full-time')
      .checkIn(['full-time', 'part-time', 'contract', 'remote', 'internship', 'freelance']);
    table.boolean('is_external').defaultTo(false);
    table.string('external_url', 500);
    table.boolean('is_active').defaultTo(true);
    table.jsonb('requirements').defaultTo('[]');
    table.jsonb('responsibilities').defaultTo('[]');
    table.decimal('min_salary', 15, 2);
    table.decimal('max_salary', 15, 2);
    table.string('currency', 10).defaultTo('USD');
    table.string('company_logo_url', 500);
    table.string('company_name', 255);
    table.timestamp('created_at').defaultTo(new Date());
    table.timestamp('updated_at').defaultTo(new Date());

    table.index('created_at', 'jobs_created_at_index');
    table.index('is_active', 'jobs_is_active_index');
    table.index('type', 'jobs_type_index');
  });

  // Create menu_items table
  await knex.schema.createTable('menu_items', (table) => {
    table.increments('id').primary();
    table.string('menu_key', 100).notNullable().unique();
    table.string('label', 200).notNullable();
    table.text('description');
    table.string('route_path', 500);
    table.string('route_name', 200);
    table.string('icon', 100);
    table.integer('parent_id').references('id').inTable('menu_items').onDelete('CASCADE');
    table.integer('display_order').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_external').defaultTo(false);
    table.string('target', 20).defaultTo('_self');
    table.string('badge_text', 50);
    table.string('badge_variant', 50);
    table.boolean('requires_auth').defaultTo(false);
    table.jsonb('metadata');
    table.timestamp('created_at').defaultTo(new Date());
    table.timestamp('updated_at').defaultTo(new Date());

    table.index('is_active', 'idx_menu_items_active');
    table.index('menu_key', 'idx_menu_items_key');
    table.index('display_order', 'idx_menu_items_order');
    table.index('parent_id', 'idx_menu_items_parent');
  });

  // Create library_categories table
  await knex.schema.createTable('library_categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).notNullable().unique();
    table.text('description');
    table.string('icon', 50);
    table.integer('sort_order').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.string('slug', 100).notNullable().unique();
    table.timestamp('created_at').defaultTo(new Date());
    table.timestamp('updated_at').defaultTo(new Date());

    table.index('is_active', 'library_categories_is_active_index');
    table.index('slug', 'library_categories_slug_index');
  });

  // Create shop_categories table
  await knex.schema.createTable('shop_categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 100).notNullable();
    table.string('slug', 100).notNullable().unique();
    table.text('description');
    table.uuid('parent_id').references('id').inTable('shop_categories').onDelete('SET NULL');
    table.string('icon_url', 255);
    table.integer('display_order').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(new Date());
    table.timestamp('updated_at').defaultTo(new Date());

    table.index('is_active', 'shop_categories_is_active_index');
    table.index('parent_id', 'shop_categories_parent_id_index');
    table.index('slug', 'shop_categories_slug_index');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('shop_categories');
  await knex.schema.dropTableIfExists('library_categories');
  await knex.schema.dropTableIfExists('menu_items');
  await knex.schema.dropTableIfExists('jobs');
  await knex.schema.dropTableIfExists('subject_groups');
  await knex.schema.dropTableIfExists('grading_scales');
  await knex.schema.dropTableIfExists('subjects');
  await knex.schema.dropTableIfExists('xp_levels');
  await knex.schema.dropTableIfExists('xp_activities');
  await knex.schema.dropTableIfExists('institution_settings');
  await knex.schema.dropTableIfExists('subscription_tiers');
  await knex.schema.dropTableIfExists('categories');
  await knex.schema.dropTableIfExists('parents');
  await knex.schema.dropTableIfExists('tags');
  await knex.schema.dropTableIfExists('tag_categories');
  await knex.schema.dropTableIfExists('permissions');
  await knex.schema.dropTableIfExists('roles');
};
