/**
 * Create subscription tables migration
 */

exports.up = function(knex) {
    return knex.schema
        // Create subscription_tiers table
        .createTable('subscription_tiers', function(table) {
            table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            table.string('slug').unique().notNullable();
            table.string('name').notNullable();
            table.text('description');
            table.text('short_description');
            table.decimal('price', 10, 2).notNullable();
            table.string('currency', 3).defaultTo('USD');
            table.integer('billing_cycle_months').defaultTo(1); // 1 for monthly, 12 for yearly
            table.integer('billing_cycle_days').defaultTo(30); // fallback for custom periods
            table.jsonb('features'); // array of feature descriptions
            table.boolean('is_popular').defaultTo(false);
            table.integer('max_users').defaultTo(-1); // -1 for unlimited
            table.boolean('is_active').defaultTo(true);
            table.integer('sort_order').defaultTo(0);
            table.string('stripe_price_id').nullable(); // for Stripe integration
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());

            table.index(['is_active', 'sort_order']);
            table.index(['slug']);
        })
        // Create user_subscriptions table
        .createTable('user_subscriptions', function(table) {
            table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            table.uuid('user_id').notNullable();
            table.uuid('tier_id').notNullable();
            table.string('status').defaultTo('pending'); // pending, active, expired, cancelled
            table.timestamp('started_at').defaultTo(knex.fn.now());
            table.timestamp('expires_at').nullable();
            table.timestamp('cancelled_at').nullable();
            table.string('payment_provider').defaultTo('manual');
            table.string('subscription_id').nullable(); // external subscription ID
            table.decimal('amount_paid', 10, 2).nullable();
            table.string('currency', 3).defaultTo('USD');
            table.jsonb('metadata');
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());

            // Foreign keys
            table.foreign('user_id').references('users.id').onDelete('CASCADE');
            table.foreign('tier_id').references('subscription_tiers.id').onDelete('CASCADE');

            // Indexes
            table.index(['user_id', 'status']);
            table.index(['tier_id']);
            table.index(['status', 'expires_at']);
            table.unique(['user_id', 'tier_id', 'status']); // prevent duplicate active subscriptions
        })
        // Add subscription to users table
        .alterTable('users', function(table) {
            table.uuid('active_subscription_id').nullable();
            table.foreign('active_subscription_id').references('user_subscriptions.id').onDelete('SET NULL');
        });
};

exports.down = function(knex) {
    return knex.schema
        .alterTable('users', function(table) {
            table.dropForeign(['active_subscription_id']);
            table.dropColumn('active_subscription_id');
        })
        .dropTableIfExists('user_subscriptions')
        .dropTableIfExists('subscription_tiers');
};
