/**
 * Create pathways tables for career development programs
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Main pathways table
    .createTable('pathways', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('title', 255).notNullable();
      table.string('slug', 255).unique().notNullable();
      table.text('description');
      table.text('short_description');
      table.string('thumbnail_url');
      table.string('banner_url');
      
      // Career focus and categorization
      table.string('career_focus', 100); // e.g., 'Web Development', 'Data Science'
      table.uuid('category_id').references('id').inTable('categories').onDelete('SET NULL');
      
      // Difficulty and duration
      table.enum('level', ['beginner', 'intermediate', 'advanced', 'all']).defaultTo('all');
      table.decimal('estimated_duration_hours', 10, 2); // Total duration of all courses
      table.integer('course_count').defaultTo(0); // Number of courses in pathway
      
      // Pricing
      table.decimal('price', 10, 2).defaultTo(0);
      table.string('currency', 3).defaultTo('USD');
      
      // Certification
      table.boolean('has_certification').defaultTo(false);
      table.text('certification_criteria'); // JSON or text describing requirements
      
      // Publication and features
      table.boolean('is_published').defaultTo(false);
      table.boolean('is_featured').defaultTo(false);
      table.timestamp('published_at');
      
      // Enrollment
      table.integer('enrollment_limit');
      table.integer('enrollment_count').defaultTo(0);
      
      // Instructor/creator
      table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
      
      // Stats
      table.decimal('rating_average', 3, 2).defaultTo(0);
      table.integer('rating_count').defaultTo(0);
      table.integer('completion_count').defaultTo(0);
      
      // Metadata
      table.jsonb('metadata');
      
      // Timestamps
      table.timestamps(true, true);
      
      // Indexes
      table.index('slug');
      table.index('career_focus');
      table.index('category_id');
      table.index('is_published');
      table.index('created_by');
    })
    
    // Pathway courses junction table
    .createTable('pathway_courses', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('pathway_id').notNullable().references('id').inTable('pathways').onDelete('CASCADE');
      table.uuid('course_id').notNullable().references('id').inTable('courses').onDelete('CASCADE');
      
      // Ordering
      table.integer('sequence_order').notNullable(); // Order in which courses should be taken
      
      // Course requirements
      table.boolean('is_required').defaultTo(true); // Required vs optional courses
      table.text('description'); // Custom description for this course within the pathway
      table.jsonb('learning_objectives'); // Specific objectives for this course in pathway
      
      // Prerequisites within pathway
      table.uuid('prerequisite_course_id').references('id').inTable('courses').onDelete('SET NULL');
      
      // Timestamps
      table.timestamps(true, true);
      
      // Constraints
      table.unique(['pathway_id', 'course_id']);
      table.index('pathway_id');
      table.index('course_id');
      table.index('sequence_order');
    })
    
    // Pathway enrollments
    .createTable('pathway_enrollments', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.uuid('pathway_id').notNullable().references('id').inTable('pathways').onDelete('CASCADE');
      
      // Enrollment details
      table.uuid('transaction_id').references('id').inTable('transactions').onDelete('SET NULL');
      table.enum('enrollment_type', ['free', 'paid', 'gifted', 'admin']).defaultTo('paid');
      
      // Progress tracking
      table.decimal('progress_percent', 5, 2).defaultTo(0);
      table.integer('completed_courses').defaultTo(0);
      table.integer('total_courses').defaultTo(0);
      
      // Timeline
      table.timestamp('enrolled_at').defaultTo(knex.fn.now());
      table.timestamp('started_at');
      table.timestamp('completed_at');
      table.timestamp('last_accessed_at');
      
      // Certification
      table.timestamp('certificate_issued_at');
      table.string('certificate_url');
      
      // Status
      table.enum('status', ['active', 'completed', 'dropped', 'suspended']).defaultTo('active');
      
      // Timestamps
      table.timestamps(true, true);
      
      // Constraints
      table.unique(['user_id', 'pathway_id']);
      table.index('user_id');
      table.index('pathway_id');
      table.index('status');
      table.index('enrolled_at');
    })
    
    // Pathway progress tracking (per course within pathway)
    .createTable('pathway_progress', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('pathway_enrollment_id').notNullable().references('id').inTable('pathway_enrollments').onDelete('CASCADE');
      table.uuid('course_id').notNullable().references('id').inTable('courses').onDelete('CASCADE');
      table.uuid('enrollment_id').references('id').inTable('enrollments').onDelete('SET NULL'); // Link to course enrollment
      
      // Progress status
      table.boolean('is_started').defaultTo(false);
      table.boolean('is_completed').defaultTo(false);
      table.decimal('progress_percent', 5, 2).defaultTo(0);
      
      // Timeline
      table.timestamp('started_at');
      table.timestamp('completed_at');
      table.timestamp('last_accessed_at');
      
      // Performance
      table.decimal('quiz_average', 5, 2);
      table.decimal('assignment_average', 5, 2);
      
      // Timestamps
      table.timestamps(true, true);
      
      // Constraints
      table.unique(['pathway_enrollment_id', 'course_id']);
      table.index('pathway_enrollment_id');
      table.index('course_id');
      table.index('is_completed');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('pathway_progress')
    .dropTableIfExists('pathway_enrollments')
    .dropTableIfExists('pathway_courses')
    .dropTableIfExists('pathways');
};
