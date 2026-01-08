/**
 * Migration: Create XP (Experience Points) System Tables
 * Creates tables for tracking user XP, transactions, and activity definitions
 */

exports.up = function (knex) {
    return knex.schema
        // XP Activities - Defines XP values for different activities
        .createTable('xp_activities', (table) => {
            table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
            table.string('activity_type', 50).unique().notNullable();
            table.integer('xp_value').notNullable();
            table.text('description');
            table.boolean('is_active').defaultTo(true);
            table.timestamp('created_at').defaultTo(new Date())
            table.timestamp('updated_at').defaultTo(new Date())
        })

        // User XP - Stores total XP and level for each user
        .createTable('user_xp', (table) => {
            table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
            table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
            table.integer('total_xp').defaultTo(0).notNullable();
            table.integer('current_level').defaultTo(1).notNullable();
            table.integer('xp_to_next_level').defaultTo(100).notNullable();
            table.timestamp('created_at').defaultTo(new Date())
            table.timestamp('updated_at').defaultTo(new Date())

            table.unique('user_id');
            table.index('user_id');
            table.index('total_xp');
            table.index('current_level');
        })

        // XP Transactions - Logs all XP changes
        .createTable('xp_transactions', (table) => {
            table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
            table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
            table.integer('amount').notNullable(); // Can be negative for deductions
            table.string('activity_type', 50).notNullable();
            table.uuid('reference_id'); // module_id, quiz_id, etc.
            table.string('reference_type', 50); // 'module', 'quiz', etc.
            table.text('description');
            table.jsonb('metadata'); // Additional data like quiz score, etc.
            table.timestamp('created_at').defaultTo(new Date())

            table.index('user_id');
            table.index('activity_type');
            table.index('created_at');
            table.index(['reference_id', 'reference_type']);
        })

        // Add XP columns to users table for quick access
        .table('users', (table) => {
            table.integer('total_xp').defaultTo(0);
            table.integer('current_level').defaultTo(1);
        })

        // Insert default XP activities
        .then(() => {
            return knex('xp_activities').insert([
                {
                    activity_type: 'video_complete',
                    xp_value: 10,
                    description: 'Complete a video module',
                    is_active: true
                },
                {
                    activity_type: 'quiz_pass',
                    xp_value: 20,
                    description: 'Pass a quiz',
                    is_active: true
                },
                {
                    activity_type: 'quiz_fail',
                    xp_value: -5,
                    description: 'Fail a quiz (XP deduction)',
                    is_active: true
                },
                {
                    activity_type: 'course_complete',
                    xp_value: 100,
                    description: 'Complete an entire course',
                    is_active: true
                }
            ]);
        });
};

exports.down = function (knex) {
    return knex.schema
        .table('users', (table) => {
            table.dropColumn('total_xp');
            table.dropColumn('current_level');
        })
        .dropTableIfExists('xp_transactions')
        .dropTableIfExists('user_xp')
        .dropTableIfExists('xp_activities');
};
