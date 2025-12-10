/**
 * Migration: Add Lesson Versioning and Content Scheduling
 * 
 * This migration adds support for:
 * 1. Lesson versioning - Track content changes over time
 * 2. Content scheduling - Schedule lessons to be published at specific times
 * 
 * Features:
 * - version: Track version number of lesson content
 * - previous_version_id: Link to previous version for history
 * - scheduled_publish_at: Schedule future publication
 * - published_at: Track when lesson was actually published
 */

exports.up = async function(knex) {
  // Add versioning and scheduling columns to lessons table
  await knex.schema.table('lessons', (table) => {
    // Versioning columns
    table.integer('version').defaultTo(1).notNullable().comment('Content version number');
    table.uuid('previous_version_id').nullable().comment('Reference to previous version');
    
    // Scheduling columns
    table.timestamp('scheduled_publish_at').nullable().comment('Scheduled publication date/time');
    table.timestamp('published_at').nullable().comment('Actual publication date/time');
    
    // Add foreign key for version history
    table.foreign('previous_version_id')
      .references('id')
      .inTable('lessons')
      .onDelete('SET NULL');
    
    // Add index for version queries
    table.index('previous_version_id', 'idx_lessons_previous_version');
    table.index('scheduled_publish_at', 'idx_lessons_scheduled_publish');
    table.index(['course_id', 'version'], 'idx_lessons_course_version');
  });

  // Create a function to auto-publish scheduled lessons
  await knex.raw(`
    CREATE OR REPLACE FUNCTION auto_publish_scheduled_lessons()
    RETURNS void AS $$
    BEGIN
      UPDATE lessons
      SET 
        is_published = true,
        published_at = NOW()
      WHERE 
        scheduled_publish_at IS NOT NULL
        AND scheduled_publish_at <= NOW()
        AND is_published = false
        AND published_at IS NULL;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Create a trigger to set published_at when is_published changes to true
  await knex.raw(`
    CREATE OR REPLACE FUNCTION set_lesson_published_at()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.is_published = true AND OLD.is_published = false THEN
        NEW.published_at = NOW();
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_set_lesson_published_at
    BEFORE UPDATE ON lessons
    FOR EACH ROW
    EXECUTE FUNCTION set_lesson_published_at();
  `);

  // Update existing published lessons to have published_at
  await knex.raw(`
    UPDATE lessons
    SET published_at = updated_at
    WHERE is_published = true AND published_at IS NULL;
  `);

  console.log('✅ Added lesson versioning and scheduling support');
};

exports.down = async function(knex) {
  // Drop triggers and functions
  await knex.raw('DROP TRIGGER IF EXISTS trigger_set_lesson_published_at ON lessons');
  await knex.raw('DROP FUNCTION IF EXISTS set_lesson_published_at()');
  await knex.raw('DROP FUNCTION IF EXISTS auto_publish_scheduled_lessons()');

  // Remove columns
  await knex.schema.table('lessons', (table) => {
    table.dropForeign('previous_version_id');
    table.dropIndex('previous_version_id', 'idx_lessons_previous_version');
    table.dropIndex('scheduled_publish_at', 'idx_lessons_scheduled_publish');
    table.dropIndex(['course_id', 'version'], 'idx_lessons_course_version');
    
    table.dropColumn('version');
    table.dropColumn('previous_version_id');
    table.dropColumn('scheduled_publish_at');
    table.dropColumn('published_at');
  });

  console.log('✅ Removed lesson versioning and scheduling support');
};
