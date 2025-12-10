/**
 * Migration: Add subscription tier to pathways table
 * Allows pathways to be tied to subscription tiers for automatic enrollment and course access
 */

exports.up = async function(knex) {
  await knex.schema.alterTable('pathways', (table) => {
    // Add subscription_tier_id field (nullable - pathways can be standalone or attributed to a tier)
    table.uuid('subscription_tier_id').references('id').inTable('subscription_tiers').onDelete('SET NULL');
    table.index('subscription_tier_id', 'idx_pathways_subscription_tier_id');
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('pathways', (table) => {
    table.dropIndex('idx_pathways_subscription_tier_id');
    table.dropColumn('subscription_tier_id');
  });
};
