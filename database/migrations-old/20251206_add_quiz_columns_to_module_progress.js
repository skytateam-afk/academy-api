/**
 * Migration: Add Quiz Columns to Module Progress
 * Adds quiz-specific tracking columns to module_progress table
 */

exports.up = async function (knex) {
    const hasTable = await knex.schema.hasTable('module_progress');

    if (!hasTable) {
        console.log('⚠️ module_progress table does not exist. Run 20251206_ensure_module_progress_table.js first.');
        return;
    }

    // Check if columns exist before adding (outside of alterTable)
    const hasCompletionData = await knex.schema.hasColumn('module_progress', 'completion_data');
    const hasQuizScore = await knex.schema.hasColumn('module_progress', 'quiz_score');
    const hasQuizPassed = await knex.schema.hasColumn('module_progress', 'quiz_passed');

    // Only alter table if there are columns to add
    const columnsToAdd = [];
    if (!hasCompletionData) columnsToAdd.push('completion_data');
    if (!hasQuizScore) columnsToAdd.push('quiz_score');
    if (!hasQuizPassed) columnsToAdd.push('quiz_passed');

    if (columnsToAdd.length > 0) {
        await knex.schema.alterTable('module_progress', (table) => {
            if (!hasCompletionData) {
                table.jsonb('completion_data').nullable();
            }
            if (!hasQuizScore) {
                table.integer('quiz_score').nullable();
            }
            if (!hasQuizPassed) {
                table.boolean('quiz_passed').nullable();
            }
        });
        console.log(`✅ Added columns to module_progress: ${columnsToAdd.join(', ')}`);
    } else {
        console.log('ℹ️ All quiz columns already exist in module_progress');
    }
};

exports.down = async function (knex) {
    // Remove the added columns
    const hasTable = await knex.schema.hasTable('module_progress');
    
    if (hasTable) {
        await knex.schema.alterTable('module_progress', (table) => {
            table.dropColumn('completion_data');
            table.dropColumn('quiz_score');
            table.dropColumn('quiz_passed');
        });
        console.log('✅ Removed quiz columns from module_progress');
    }
};
