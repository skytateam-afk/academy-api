/**
 * Migration: Create Enrollment and Progress Tables
 * NOTE: This migration is a no-op since tables already exist in the database.
 * It's kept for migration history tracking purposes.
 * 
 * The original migration code that would create enrollment and progress tables
 * is preserved in database/schema.sql for reference.
 */

exports.up = function(knex) {
  // Tables already exist in database - no action needed
  return Promise.resolve();
};

exports.down = function(knex) {
  // No-op since tables are managed manually
  return Promise.resolve();
};
