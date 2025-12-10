/**
 * Migration: Create Result Batches Table
 * Tracks result import batches for organized result management
 */

exports.up = function (knex) {
    return knex.schema
        .createTable('result_batches', (table) => {
            table.increments('id').primary();
            table.string('batch_name', 200).notNullable().comment('Descriptive name for the batch');
            table.string('batch_code', 50).notNullable().unique().comment('Unique code for the batch (e.g., RB-2024-TERM1-001)');
            
            // Classroom and academic info
            table.integer('classroom_id').unsigned().notNullable();
            table.foreign('classroom_id').references('id').inTable('classrooms').onDelete('CASCADE');
            table.string('academic_year', 20).notNullable();
            table.string('term', 20).notNullable().comment('e.g., Term 1, Term 2, Semester 1');
            
            // Grading scale used for this batch
            table.integer('grading_scale_id').unsigned().notNullable();
            table.foreign('grading_scale_id').references('id').inTable('grading_scales').onDelete('RESTRICT');
            
            // Import tracking
            table.enum('status', ['draft', 'processing', 'completed', 'failed', 'published']).defaultTo('draft');
            table.text('csv_file_path').comment('Path to uploaded CSV file');
            table.text('error_log').comment('JSON array of errors during processing');
            
            // Statistics
            table.integer('total_students').defaultTo(0);
            table.integer('total_subjects').defaultTo(0);
            table.integer('total_results').defaultTo(0);
            table.integer('failed_imports').defaultTo(0);
            
            // Processing metadata
            table.timestamp('processed_at').comment('When the batch was processed');
            table.timestamp('published_at').comment('When results were published to students');
            
            // Audit fields
            table.uuid('created_by').notNullable().comment('Teacher/Admin who created the batch');
            table.foreign('created_by').references('id').inTable('users').onDelete('RESTRICT');
            table.uuid('updated_by').comment('Last person to update the batch');
            table.foreign('updated_by').references('id').inTable('users').onDelete('SET NULL');
            
            table.timestamps(true, true);
            
            // Indexes
            table.index(['classroom_id', 'academic_year', 'term']);
            table.index('status');
            table.index('created_by');
        });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('result_batches');
};
