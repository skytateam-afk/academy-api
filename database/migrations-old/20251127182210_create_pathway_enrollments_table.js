/**
 * Create pathway enrollments table
 * NOTE: This migration is a no-op since table already exists in the database.
 * It's kept for migration history tracking purposes.
 */
exports.up = function(knex) {
  // Tables already exist in database - no action needed
  return Promise.resolve();
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('pathway_enrollments');
};
