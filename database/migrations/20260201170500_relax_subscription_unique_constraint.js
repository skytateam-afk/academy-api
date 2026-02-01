/**
 * Migration: Relax user_subscriptions uniqueness constraint
 * Allows multiple cancelled/expired subscriptions for the same user and tier,
 * but still enforces only one active subscription per user and tier.
 */

exports.up = async function (knex) {
    // Drop the existing composite unique constraint
    // table.unique(['user_id', 'tier_id', 'status'], { indexName: 'user_subscriptions_user_id_tier_id_status_unique' });
    await knex.schema.alterTable('user_subscriptions', (table) => {
        table.dropUnique(['user_id', 'tier_id', 'status'], 'user_subscriptions_user_id_tier_id_status_unique');
    });

    // Add partial unique index for active subscriptions only (PostgreSQL specific)
    // This ensures a user can only have ONE 'active' subscription to the SAME tier.
    await knex.raw(`
    CREATE UNIQUE INDEX user_subscriptions_user_id_tier_id_active_unique 
    ON user_subscriptions (user_id, tier_id) 
    WHERE status = 'active'
  `);
};

exports.down = async function (knex) {
    // Drop the partial index
    await knex.raw('DROP INDEX IF EXISTS user_subscriptions_user_id_tier_id_active_unique');

    // Restore the original unique constraint
    await knex.schema.alterTable('user_subscriptions', (table) => {
        table.unique(['user_id', 'tier_id', 'status'], { indexName: 'user_subscriptions_user_id_tier_id_status_unique' });
    });
};
