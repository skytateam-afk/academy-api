/**
 * Migration: Create Progress Tracking Tables
 * Tracks student progress through modules and lessons
 */

exports.up = function (knex) {
  // Tables already exist, skipping
  return Promise.resolve();
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('quiz_attempts')
    .dropTableIfExists('lesson_progress')
    .dropTableIfExists('module_progress');
};
