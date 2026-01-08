/**
 * Migration: Create Lessons, Modules, and Quizzes
 * Creates lesson-related tables including modules, quizzes, and assignments
 */

exports.up = async function(knex) {
  // Create lessons table
  await knex.schema.createTable('lessons', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('course_id').notNullable().references('id').inTable('courses').onDelete('CASCADE');
    table.string('title', 255).notNullable();
    table.string('slug', 255).notNullable();
    table.text('description');
    table.jsonb('content_data');
    table.text('transcript');
    table.text('rich_text_content');
    table.integer('display_order').defaultTo(0);
    table.boolean('is_published').defaultTo(false);
    table.integer('version').defaultTo(1).notNullable();
    table.uuid('previous_version_id').references('id').inTable('lessons').onDelete('SET NULL');
    table.timestamp('scheduled_publish_at');
    table.timestamp('published_at');
    table.integer('module_count').defaultTo(0);
    table.jsonb('metadata');
    table.timestamp('created_at').defaultTo(new Date());
    table.timestamp('updated_at').defaultTo(new Date());

    table.unique(['course_id', 'slug'], { indexName: 'unique_course_lesson_slug' });
    table.index('course_id', 'idx_lessons_course_id');
    table.index(['course_id', 'version'], 'idx_lessons_course_version');
    table.index(['course_id', 'display_order'], 'idx_lessons_display_order');
    table.index('previous_version_id', 'idx_lessons_previous_version');
    table.index('scheduled_publish_at', 'idx_lessons_scheduled_publish');
  });

  // Create lesson_attachments table
  await knex.schema.createTable('lesson_attachments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('lesson_id').notNullable().references('id').inTable('lessons').onDelete('CASCADE').onUpdate('CASCADE');
    table.string('title', 255).notNullable();
    table.text('file_url').notNullable();
    table.string('file_type', 100);
    table.bigInteger('file_size').defaultTo(0);
    table.integer('display_order').defaultTo(0);
    table.boolean('is_downloadable').defaultTo(true);
    table.timestamp('created_at').defaultTo(new Date()).notNullable();
    table.timestamp('updated_at').defaultTo(new Date()).notNullable();

    table.index('lesson_id', 'lesson_attachments_lesson_id_index');
    table.index(['lesson_id', 'display_order'], 'lesson_attachments_lesson_id_display_order_index');
  });

  // Create lesson_modules table
  await knex.schema.createTable('lesson_modules', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('lesson_id').notNullable().references('id').inTable('lessons').onDelete('CASCADE');
    table.string('title', 255).notNullable();
    table.string('slug', 255).notNullable();
    table.text('description');
    table.text('content_type').notNullable()
      .checkIn(['video', 'audio', 'text', 'document', 'interactive', 'mixed']);
    table.string('video_url', 500);
    table.integer('video_duration');
    table.string('audio_url', 500);
    table.integer('audio_duration');
    table.text('text_content');
    table.string('document_url', 500);
    table.jsonb('interactive_content');
    table.integer('duration_minutes');
    table.integer('order_index').defaultTo(0).notNullable();
    table.boolean('is_preview').defaultTo(false);
    table.boolean('is_published').defaultTo(false);
    table.integer('version').defaultTo(1).notNullable();
    table.uuid('previous_version_id').references('id').inTable('lesson_modules').onDelete('SET NULL');
    table.timestamp('published_at');
    table.timestamp('created_at').defaultTo(new Date()).notNullable();
    table.timestamp('updated_at').defaultTo(new Date()).notNullable();

    table.unique(['lesson_id', 'slug'], { indexName: 'unique_module_slug_per_lesson' });
    table.index('lesson_id', 'idx_modules_lesson');
    table.index(['lesson_id', 'order_index'], 'idx_modules_lesson_order');
    table.index('slug', 'idx_modules_slug');
  });

  // Create module_attachments table
  await knex.schema.createTable('module_attachments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('module_id').notNullable().references('id').inTable('lesson_modules').onDelete('CASCADE');
    table.string('title', 255).notNullable();
    table.text('description');
    table.string('file_url', 500).notNullable();
    table.string('file_type', 100).notNullable();
    table.bigInteger('file_size').notNullable();
    table.boolean('is_downloadable').defaultTo(true);
    table.integer('order_index').defaultTo(0).notNullable();
    table.timestamp('created_at').defaultTo(new Date()).notNullable();
    table.timestamp('updated_at').defaultTo(new Date()).notNullable();

    table.index('module_id', 'idx_attachments_module');
    table.index(['module_id', 'order_index'], 'idx_attachments_module_order');
  });

  // Create quizzes table
  await knex.schema.createTable('quizzes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('lesson_id').references('id').inTable('lessons').onDelete('CASCADE');
    table.uuid('course_id').references('id').inTable('courses').onDelete('CASCADE');
    table.string('title', 255).notNullable();
    table.text('description');
    table.string('quiz_type', 20)
      .checkIn(['lesson', 'course', 'practice']);
    table.integer('passing_score').defaultTo(70);
    table.integer('max_attempts').defaultTo(3);
    table.integer('time_limit_minutes');
    table.boolean('is_randomized').defaultTo(false);
    table.boolean('show_correct_answers').defaultTo(true);
    table.boolean('show_results_immediately').defaultTo(true);
    table.boolean('is_published').defaultTo(false);
    table.timestamp('created_at').defaultTo(new Date());
    table.timestamp('updated_at').defaultTo(new Date());
  });

  // Create quiz_questions table
  await knex.schema.createTable('quiz_questions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('quiz_id').notNullable().references('id').inTable('quizzes').onDelete('CASCADE');
    table.text('question_text').notNullable();
    table.string('question_type', 20)
      .checkIn(['multiple_choice', 'true_false', 'short_answer', 'essay']);
    table.integer('points').defaultTo(1);
    table.integer('display_order').defaultTo(0);
    table.text('explanation');
    table.jsonb('metadata');
    table.timestamp('created_at').defaultTo(new Date());
    table.timestamp('updated_at').defaultTo(new Date());
  });

  // Create quiz_question_options table
  await knex.schema.createTable('quiz_question_options', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('question_id').notNullable().references('id').inTable('quiz_questions').onDelete('CASCADE');
    table.text('option_text').notNullable();
    table.boolean('is_correct').defaultTo(false);
    table.integer('display_order').defaultTo(0);
    table.timestamp('created_at').defaultTo(new Date());
  });

  // Create quiz_attempts table
  await knex.schema.createTable('quiz_attempts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('quiz_id').notNullable().references('id').inTable('quizzes').onDelete('CASCADE');
    table.uuid('enrollment_id').notNullable();
    table.integer('attempt_number').notNullable();
    table.timestamp('started_at').defaultTo(new Date());
    table.timestamp('completed_at');
    table.integer('score');
    table.integer('max_score');
    table.boolean('passed');
    table.integer('time_taken_seconds');
    table.jsonb('answers');
    table.timestamp('created_at').defaultTo(new Date());
  });

  // Create assignments table
  await knex.schema.createTable('assignments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('lesson_id').references('id').inTable('lessons').onDelete('CASCADE');
    table.uuid('course_id').references('id').inTable('courses').onDelete('CASCADE');
    table.string('title', 255).notNullable();
    table.text('description');
    table.text('instructions');
    table.integer('max_score').defaultTo(100);
    table.timestamp('due_date');
    table.boolean('allow_late_submission').defaultTo(false);
    table.integer('late_penalty_percent').defaultTo(0);
    table.string('submission_type', 20)
      .checkIn(['file', 'text', 'url', 'mixed']);
    table.bigInteger('max_file_size');
    table.specificType('allowed_file_types', 'text[]');
    table.boolean('is_published').defaultTo(false);
    table.timestamp('created_at').defaultTo(new Date());
    table.timestamp('updated_at').defaultTo(new Date());
  });

  // Create assignment_submissions table
  await knex.schema.createTable('assignment_submissions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('assignment_id').notNullable().references('id').inTable('assignments').onDelete('CASCADE');
    table.uuid('enrollment_id').notNullable();
    table.text('submission_text');
    table.text('submission_url');
    table.specificType('file_urls', 'text[]');
    table.timestamp('submitted_at').defaultTo(new Date());
    table.timestamp('graded_at');
    table.uuid('graded_by').references('id').inTable('users');
    table.integer('score');
    table.integer('max_score');
    table.text('feedback');
    table.string('status', 20).defaultTo('submitted')
      .checkIn(['draft', 'submitted', 'graded', 'returned']);
    table.boolean('is_late').defaultTo(false);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('assignment_submissions');
  await knex.schema.dropTableIfExists('assignments');
  await knex.schema.dropTableIfExists('quiz_attempts');
  await knex.schema.dropTableIfExists('quiz_question_options');
  await knex.schema.dropTableIfExists('quiz_questions');
  await knex.schema.dropTableIfExists('quizzes');
  await knex.schema.dropTableIfExists('module_attachments');
  await knex.schema.dropTableIfExists('lesson_modules');
  await knex.schema.dropTableIfExists('lesson_attachments');
  await knex.schema.dropTableIfExists('lessons');
};
