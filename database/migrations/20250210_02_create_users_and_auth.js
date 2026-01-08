/**
 * Migration: Create Users and Authentication Tables
 * Creates users table and all authentication-related tables
 */

exports.up = async function(knex) {
  // Create user_subscriptions table first (referenced by users)
  await knex.schema.createTable('user_subscriptions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable();
    table.uuid('tier_id').notNullable().references('id').inTable('subscription_tiers').onDelete('CASCADE');
    table.string('status', 255).defaultTo('pending');
    table.timestamp('started_at').defaultTo(new Date()
    table.timestamp('expires_at');
    table.timestamp('cancelled_at');
    table.string('payment_provider', 255).defaultTo('manual');
    table.string('subscription_id', 255);
    table.decimal('amount_paid', 10, 2);
    table.string('currency', 3).defaultTo('USD');
    table.jsonb('metadata');
    table.timestamp('created_at').defaultTo(new Date());
    table.timestamp('updated_at').defaultTo(new Date());

    table.unique(['user_id', 'tier_id', 'status'], { indexName: 'user_subscriptions_user_id_tier_id_status_unique' });
    table.index(['user_id', 'status'], 'user_subscriptions_user_id_status_index');
    table.index(['status', 'expires_at'], 'user_subscriptions_status_expires_at_index');
    table.index('tier_id', 'user_subscriptions_tier_id_index');
  });

  // Create users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('username', 50).notNullable().unique();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('first_name', 100);
    table.string('last_name', 100);
    table.text('avatar_url');
    table.text('bio');
    table.string('phone', 20);
    table.date('date_of_birth');
    table.uuid('role_id').references('id').inTable('roles').onDelete('SET NULL');
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_verified').defaultTo(false);
    table.timestamp('email_verified_at');
    table.integer('failed_login_attempts').defaultTo(0);
    table.timestamp('locked_until');
    table.timestamp('last_login');
    table.specificType('last_login_ip', 'inet');
    table.boolean('mfa_enabled').defaultTo(false);
    table.text('cover_photo_url');
    table.uuid('parent_id').references('id').inTable('parents').onDelete('SET NULL');
    table.uuid('active_subscription_id').references('id').inTable('user_subscriptions').onDelete('SET NULL');
    table.integer('total_xp').defaultTo(0);
    table.integer('current_level').defaultTo(1);
    table.string('google_id', 255).unique();
    table.timestamp('created_at').defaultTo(new Date());
    table.timestamp('updated_at').defaultTo(new Date());

    table.index('email', 'idx_users_email');
    table.index('is_active', 'idx_users_is_active');
    table.index('role_id', 'idx_users_role_id');
    table.index('username', 'idx_users_username');
    table.index('parent_id', 'users_parent_id_index');
  });

  // Add foreign key to user_subscriptions now that users exists
  await knex.schema.alterTable('user_subscriptions', (table) => {
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
  });

  // Update grading_scales and subject_groups foreign keys
  await knex.schema.alterTable('grading_scales', (table) => {
    table.foreign('created_by').references('id').inTable('users').onDelete('SET NULL');
  });

  await knex.schema.alterTable('subject_groups', (table) => {
    table.foreign('created_by').references('id').inTable('users');
  });

  // Create sessions table
  await knex.schema.createTable('sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('token_hash', 255).notNullable();
    table.string('refresh_token_hash', 255);
    table.specificType('ip_address', 'inet');
    table.text('user_agent');
    table.timestamp('expires_at').notNullable();
    table.timestamp('refresh_expires_at');
    table.timestamp('created_at').defaultTo(new Date());
    table.timestamp('last_activity').defaultTo(new Date());
  });

  // Create otp table
  await knex.schema.createTable('otp', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('otp_code', 6).notNullable();
    table.string('purpose', 50).notNullable();
    table.timestamp('expires_at').notNullable();
    table.boolean('used').defaultTo(false);
    table.timestamp('used_at');
    table.timestamp('created_at').defaultTo(new Date());
  });

  // Create otp_codes table
  await knex.schema.createTable('otp_codes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255).notNullable();
    table.string('code', 10).notNullable();
    table.string('type', 50).defaultTo('login').notNullable();
    table.timestamp('expires_at').notNullable();
    table.boolean('is_used').defaultTo(false);
    table.timestamp('used_at');
    table.string('ip_address', 45);
    table.text('user_agent');
    table.jsonb('metadata');
    table.timestamp('created_at').defaultTo(new Date());

    table.index(['email', 'code', 'is_used'], 'otp_codes_email_code_is_used_index');
    table.index('email', 'otp_codes_email_index');
    table.index(['expires_at', 'is_used'], 'otp_codes_expires_at_is_used_index');
  });

  // Create password_reset_tokens table
  await knex.schema.createTable('password_reset_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('token_hash', 255).notNullable();
    table.timestamp('expires_at').notNullable();
    table.boolean('used').defaultTo(false);
    table.timestamp('used_at');
    table.timestamp('created_at').defaultTo(new Date());
  });

  // Create role_permissions table
  await knex.schema.createTable('role_permissions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('role_id').notNullable().references('id').inTable('roles').onDelete('CASCADE');
    table.uuid('permission_id').notNullable().references('id').inTable('permissions').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(new Date());

    table.unique(['role_id', 'permission_id'], { indexName: 'unique_role_permission' });
  });

  // Create user_permissions table
  await knex.schema.createTable('user_permissions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('permission_id').notNullable().references('id').inTable('permissions').onDelete('CASCADE');
    table.boolean('granted').defaultTo(true);
    table.timestamp('created_at').defaultTo(new Date());

    table.unique(['user_id', 'permission_id'], { indexName: 'unique_user_permission' });
  });

  // Create users_permissions table
  await knex.schema.createTable('users_permissions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('permission_id').references('id').inTable('permissions').onDelete('CASCADE');
    table.uuid('granted_by').references('id').inTable('users');
    table.timestamp('granted_at').defaultTo(new Date());

    table.unique(['user_id', 'permission_id'], { indexName: 'users_permissions_user_id_permission_id_unique' });
  });

  // Create user_settings table
  await knex.schema.createTable('user_settings', (table) => {
    table.increments('id').primary();
    table.uuid('user_id').notNullable().unique().references('id').inTable('users').onDelete('CASCADE');
    table.string('ui_mode', 255).defaultTo('explorer');
    table.string('theme', 255).defaultTo('green');
    table.string('theme_mode', 255).defaultTo('light');
    table.boolean('email_course_updates').defaultTo(true);
    table.boolean('email_new_announcements').defaultTo(true);
    table.boolean('email_assignment_reminders').defaultTo(true);
    table.boolean('email_quiz_results').defaultTo(true);
    table.boolean('email_new_messages').defaultTo(true);
    table.boolean('email_marketing').defaultTo(false);
    table.boolean('inapp_course_updates').defaultTo(true);
    table.boolean('inapp_new_announcements').defaultTo(true);
    table.boolean('inapp_assignment_reminders').defaultTo(true);
    table.boolean('inapp_quiz_results').defaultTo(true);
    table.boolean('inapp_new_messages').defaultTo(true);
    table.boolean('profile_public').defaultTo(false);
    table.boolean('show_progress_publicly').defaultTo(false);
    table.string('timezone', 255).defaultTo('UTC');
    table.string('language', 255).defaultTo('en');
    table.timestamp('created_at').defaultTo(new Date()).notNullable();
    table.timestamp('updated_at').defaultTo(new Date()).notNullable();
  });

  // Create user_personalisations table
  await knex.schema.createTable('user_personalisations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().unique().references('id').inTable('users').onDelete('CASCADE');
    table.jsonb('data').defaultTo('{}');
    table.timestamp('created_at').defaultTo(new Date()).notNullable();
    table.timestamp('updated_at').defaultTo(new Date()).notNullable();
  });

  // Create user_storage table
  await knex.schema.createTable('user_storage', (table) => {
    table.uuid('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
    table.bigInteger('used_bytes').defaultTo(0);
    table.bigInteger('quota_bytes').defaultTo(1073741824);
    table.timestamp('updated_at').defaultTo(new Date());

    table.index('user_id', 'user_storage_user_id_index');
  });

  // Create user_xp table
  await knex.schema.createTable('user_xp', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().unique().references('id').inTable('users').onDelete('CASCADE');
    table.integer('total_xp').defaultTo(0).notNullable();
    table.integer('current_level').defaultTo(1).notNullable();
    table.integer('xp_to_next_level').defaultTo(100).notNullable();
    table.timestamp('created_at').defaultTo(new Date());
    table.timestamp('updated_at').defaultTo(new Date());

    table.index('current_level', 'user_xp_current_level_index');
    table.index('total_xp', 'user_xp_total_xp_index');
    table.index('user_id', 'user_xp_user_id_index');
  });

  // Create xp_transactions table
  await knex.schema.createTable('xp_transactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('amount').notNullable();
    table.string('activity_type', 50).notNullable();
    table.uuid('reference_id');
    table.string('reference_type', 50);
    table.text('description');
    table.jsonb('metadata');
    table.timestamp('created_at').defaultTo(new Date());

    table.index('activity_type', 'xp_transactions_activity_type_index');
    table.index('created_at', 'xp_transactions_created_at_index');
    table.index(['reference_id', 'reference_type'], 'xp_transactions_reference_id_reference_type_index');
    table.index('user_id', 'xp_transactions_user_id_index');
  });

  // Create notifications table
  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('type', 50).notNullable();
    table.string('title', 255).notNullable();
    table.text('message');
    table.jsonb('data');
    table.boolean('is_read').defaultTo(false);
    table.timestamp('read_at');
    table.timestamp('created_at').defaultTo(new Date());
  });

  // Create audit_logs table
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('username', 50);
    table.string('action', 100).notNullable();
    table.string('resource', 100);
    table.uuid('resource_id');
    table.specificType('ip_address', 'inet');
    table.text('user_agent');
    table.boolean('success').notNullable();
    table.text('error_message');
    table.jsonb('metadata');
    table.timestamp('created_at').defaultTo(new Date());

    table.index('action', 'idx_audit_logs_action');
    table.index('created_at', 'idx_audit_logs_created_at');
    table.index('user_id', 'idx_audit_logs_user_id');
  });

  // Create work_profiles table
  await knex.schema.createTable('work_profiles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').unique().references('id').inTable('users').onDelete('CASCADE');
    table.string('headline', 255);
    table.text('bio');
    table.jsonb('skills').defaultTo('[]');
    table.jsonb('projects').defaultTo('[]');
    table.string('resume_url', 500);
    table.string('linkedin_url', 500);
    table.string('portfolio_url', 500);
    table.jsonb('experience').defaultTo('[]');
    table.jsonb('education').defaultTo('[]');
    table.timestamp('created_at').defaultTo(new Date());
    table.timestamp('updated_at').defaultTo(new Date());

    table.index('user_id', 'work_profiles_user_id_index');
  });

  // Create job_profiles table
  await knex.schema.createTable('job_profiles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().unique().references('id').inTable('users').onDelete('CASCADE');
    table.string('title', 255).notNullable();
    table.text('skills');
    table.integer('years_of_experience').defaultTo(0);
    table.jsonb('preferred_types');
    table.text('preferred_locations');
    table.text('resume_url');
    table.text('bio');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(new Date()).notNullable();
    table.timestamp('updated_at').defaultTo(new Date()).notNullable();

    table.index('user_id', 'idx_job_profiles_user_id');
  });

  // Create job_applications table
  await knex.schema.createTable('job_applications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('job_id').references('id').inTable('jobs').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('email', 255).notNullable();
    table.string('phone', 50);
    table.string('resume_url', 500).notNullable();
    table.string('cover_letter_url', 500);
    table.text('status').defaultTo('pending')
      .checkIn(['pending', 'reviewed', 'shortlisted', 'interview', 'rejected', 'hired', 'withdrawn']);
    table.text('admin_notes');
    table.timestamp('created_at').defaultTo(new Date());
    table.timestamp('updated_at').defaultTo(new Date());

    table.index('email', 'job_applications_email_index');
    table.index('job_id', 'job_applications_job_id_index');
    table.index('status', 'job_applications_status_index');
    table.index('user_id', 'job_applications_user_id_index');
  });

  // Create menu_item_user_types table
  await knex.schema.createTable('menu_item_user_types', (table) => {
    table.increments('id').primary();
    table.integer('menu_item_id').notNullable().references('id').inTable('menu_items').onDelete('CASCADE');
    table.string('user_type', 50).notNullable();
    table.boolean('is_visible').defaultTo(true);
    table.timestamp('created_at').defaultTo(new Date());

    table.unique(['menu_item_id', 'user_type'], { indexName: 'menu_item_user_types_menu_item_id_user_type_key' });
    table.index('menu_item_id', 'idx_menu_user_types_menu');
    table.index('user_type', 'idx_menu_user_types_type');
  });

  // Create menu_visibility_settings table
  await knex.schema.createTable('menu_visibility_settings', (table) => {
    table.increments('id').primary();
    table.string('user_type', 50).notNullable();
    table.string('menu_key', 100).notNullable();
    table.boolean('is_visible').defaultTo(true);
    table.integer('display_order').defaultTo(0);
    table.string('menu_name', 255);
    table.string('route', 500);
    table.string('icon', 100);
    table.text('description');
    table.string('category', 100);
    table.string('parent_group', 255);
    table.timestamp('created_at').defaultTo(new Date());
    table.timestamp('updated_at').defaultTo(new Date());

    table.unique(['user_type', 'menu_key'], { indexName: 'menu_visibility_settings_user_type_menu_key_key' });
    table.index('user_type', 'idx_menu_visibility_user_type');
    table.index('is_visible', 'idx_menu_visibility_visible');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('menu_visibility_settings');
  await knex.schema.dropTableIfExists('menu_item_user_types');
  await knex.schema.dropTableIfExists('job_applications');
  await knex.schema.dropTableIfExists('job_profiles');
  await knex.schema.dropTableIfExists('work_profiles');
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('xp_transactions');
  await knex.schema.dropTableIfExists('user_xp');
  await knex.schema.dropTableIfExists('user_storage');
  await knex.schema.dropTableIfExists('user_personalisations');
  await knex.schema.dropTableIfExists('user_settings');
  await knex.schema.dropTableIfExists('users_permissions');
  await knex.schema.dropTableIfExists('user_permissions');
  await knex.schema.dropTableIfExists('role_permissions');
  await knex.schema.dropTableIfExists('password_reset_tokens');
  await knex.schema.dropTableIfExists('otp_codes');
  await knex.schema.dropTableIfExists('otp');
  await knex.schema.dropTableIfExists('sessions');
  
  // Remove foreign keys before dropping tables
  await knex.schema.alterTable('subject_groups', (table) => {
    table.dropForeign('created_by');
  });
  await knex.schema.alterTable('grading_scales', (table) => {
    table.dropForeign('created_by');
  });
  
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('user_subscriptions');
};
