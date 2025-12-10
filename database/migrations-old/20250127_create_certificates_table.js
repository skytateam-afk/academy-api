/**
 * Migration: Create certificates table
 * Tracks course completion certificates for students
 */

exports.up = function (knex) {
  // Table already exists, skipping
  return Promise.resolve();
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('certificates');
};
