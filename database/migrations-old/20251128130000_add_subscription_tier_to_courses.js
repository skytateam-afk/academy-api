/**
 * Migration: Add subscription tier to courses table
 * Allows courses to be tied to subscription tiers for automatic enrollment and pricing
 */

exports.up = async function(knex) {
  await knex.schema.alterTable('courses', (table) => {
    // Add subscription_tier_id field (nullable - courses can be standalone or attributed to a tier)
    table.uuid('subscription_tier_id').references('id').inTable('subscription_tiers').onDelete('SET NULL');
    table.index('subscription_tier_id', 'idx_courses_subscription_tier_id');
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('courses', (table) => {
    table.dropIndex('idx_courses_subscription_tier_id');
    table.dropColumn('subscription_tier_id');
  });
};
