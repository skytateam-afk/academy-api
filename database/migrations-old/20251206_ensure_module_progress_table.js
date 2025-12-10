/**
 * Migration: Ensure Module Progress Table
 * Ensures module_progress table exists and has correct constraints
 */

exports.up = async function (knex) {
    const hasTable = await knex.schema.hasTable('module_progress');

    if (!hasTable) {
        // Create the table if it doesn't exist
        await knex.schema.createTable('module_progress', (table) => {
            table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
            table.uuid('module_id').notNullable().references('id').inTable('lesson_modules').onDelete('CASCADE');
            table.uuid('course_id').notNullable().references('id').inTable('courses').onDelete('CASCADE');

            table.boolean('is_completed').defaultTo(false);
            table.integer('completion_percentage').defaultTo(0);
            table.timestamp('completed_at').nullable();
            table.timestamp('last_accessed_at').defaultTo(knex.fn.now());

            table.integer('time_spent_seconds').defaultTo(0);

            // Video specific tracking
            table.integer('video_progress_seconds').nullable();
            table.integer('video_duration_seconds').nullable();

            // Quiz specific tracking
            table.jsonb('completion_data').nullable(); // Stores quiz answers, etc
            table.integer('quiz_score').nullable();
            table.boolean('quiz_passed').nullable();

            table.timestamps(true, true);

            // Indexes
            table.index('user_id');
            table.index('course_id');
            table.index('module_id');
            table.unique(['user_id', 'module_id']); // Critical for ON CONFLICT upsert
        });

        console.log('✅ Created module_progress table');
    } else {
        // Check if unique constraint exists safely using information_schema or pg_constraint
        // But simpler: just check unique index
        const indexResult = await knex.raw(`
            SELECT 1 
            FROM pg_indexes 
            WHERE tablename = 'module_progress' 
            AND indexdef LIKE '%(user_id, module_id)%'
        `);

        if (indexResult.rows.length === 0) {
            await knex.schema.alterTable('module_progress', (table) => {
                table.unique(['user_id', 'module_id']);
            });
            console.log('✅ Added unique constraint to module_progress');
        }
    }
};

exports.down = async function (knex) {
    // We don't drop the table in down migration because it might contain valid user data
    // and might have existed before. This migration is idempotent-ish.
    return Promise.resolve();
};
