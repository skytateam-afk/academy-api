/**
 * Migration: Add Payment Tables
 * Creates transactions, payment_webhooks tables and updates enrollments
 */

exports.up = function(knex) {
  // Note: This migration is now obsolete as transactions and payment_webhooks tables
  // are created in migration 20251120_00_create_initial_schema.js
  // and enrollment columns are created in 20251120_02_create_enrollment_progress_tables.js
  // This migration is kept for historical reference but does nothing.
  return Promise.resolve();
};

exports.down = function(knex) {
  // No-op since tables are managed by other migrations
  return Promise.resolve();
};
