/**
 * Job System Tables Migration
 * Creates tables for Job listings, Applications, and User Work Profiles
 */

exports.up = async function (knex) {
    // 1. Jobs Table
    await knex.schema.createTable('jobs', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('title', 255).notNullable();
        table.text('description').notNullable(); // Full rich-text description
        table.text('short_description'); // For listings
        table.string('location', 255);
        table.enum('type', ['full-time', 'part-time', 'contract', 'remote', 'internship', 'freelance']).defaultTo('full-time');
        table.boolean('is_external').defaultTo(false);
        table.string('external_url', 500); // If external job
        table.boolean('is_active').defaultTo(true);

        // Detailed structured fields
        table.jsonb('requirements').defaultTo('[]'); // Array of requirement strings
        table.jsonb('responsibilities').defaultTo('[]'); // Array of responsibility strings

        // Compensation
        table.decimal('min_salary', 15, 2);
        table.decimal('max_salary', 15, 2);
        table.string('currency', 10).defaultTo('USD');

        table.timestamp('created_at').defaultTo(new Date())
        table.timestamp('updated_at').defaultTo(new Date())

        table.index('is_active');
        table.index('type');
        table.index('created_at');
    });

    // 2. Work Profiles Table
    await knex.schema.createTable('work_profiles', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').unique(); // One profile per user

        table.string('headline', 255);
        table.text('bio');

        table.jsonb('skills').defaultTo('[]'); // Array of skill strings
        table.jsonb('projects').defaultTo('[]'); // Array of project objects { name, description, url, etc }

        table.string('resume_url', 500); // Default resume URL from R2
        table.string('linkedin_url', 500);
        table.string('portfolio_url', 500);

        table.jsonb('experience').defaultTo('[]'); // Array of experience objects
        table.jsonb('education').defaultTo('[]'); // Array of education objects

        table.timestamp('created_at').defaultTo(new Date())
        table.timestamp('updated_at').defaultTo(new Date())

        table.index('user_id');
    });

    // 3. Job Applications Table
    await knex.schema.createTable('job_applications', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('job_id').references('id').inTable('jobs').onDelete('CASCADE');
        table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL'); // Nullable for public applicants who might sign up later or guest apply (though design implies auth preferred for best match)

        // Applicant details (Snapshot, even if user exists, we might want to capture specific contact info for this app)
        table.string('first_name', 100).notNullable();
        table.string('last_name', 100).notNullable();
        table.string('email', 255).notNullable();
        table.string('phone', 50);

        table.string('resume_url', 500).notNullable();
        table.string('cover_letter_url', 500);

        table.enum('status', ['pending', 'reviewed', 'shortlisted', 'interview', 'rejected', 'hired', 'withdrawn']).defaultTo('pending');

        table.text('admin_notes'); // Internal notes

        table.timestamp('created_at').defaultTo(new Date())
        table.timestamp('updated_at').defaultTo(new Date())

        table.index('job_id');
        table.index('user_id');
        table.index('status');
        table.index('email');
    });

    console.log('✓ Job system tables created successfully');
};

exports.down = async function (knex) {
    // Drop tables in reverse order
    await knex.schema.dropTableIfExists('job_applications');
    await knex.schema.dropTableIfExists('work_profiles');
    await knex.schema.dropTableIfExists('jobs');

    console.log('✓ Job system tables dropped successfully');
};
