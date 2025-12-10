/**
 * Migration: Add Payment Providers Table
 * Creates encrypted payment provider configurations
 */

exports.up = function(knex) {
  return knex.schema.createTable('payment_providers', function(table) {
    table.increments('id').primary();
    table.string('provider_name').notNullable().unique(); // 'stripe', 'paystack'
    table.string('provider_display_name').notNullable(); // 'Stripe', 'Paystack'
    table.text('secret_key_encrypted').notNullable(); // Encrypted secret key
    table.text('public_key_encrypted').notNullable(); // Encrypted public key
    table.text('webhook_secret_encrypted'); // Encrypted webhook secret (optional)
    table.boolean('is_active').notNullable().defaultTo(false);
    table.jsonb('supported_currencies'); // List of supported currencies
    table.jsonb('configuration'); // Additional provider-specific configuration
    table.timestamp('last_tested_at'); // When was this provider last tested
    table.string('test_result'); // 'success', 'failed', 'pending'
    table.text('error_message'); // If test failed, store error
    table.timestamps(true, true);

    // Add admin-only access control (UUID references)
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    // Indexes for performance
    table.index('provider_name');
    table.index('is_active');

    // Constraints - we'll handle this with trigger or manual validation
  }).then(() => {
    // Insert default disabled providers
    return knex('payment_providers').insert([
      {
        provider_name: 'stripe',
        provider_display_name: 'Stripe',
        secret_key_encrypted: '',
        public_key_encrypted: '',
        webhook_secret_encrypted: '',
        is_active: false,
        supported_currencies: JSON.stringify(['USD', 'EUR', 'GBP', 'CAD', 'AUD']),
        configuration: JSON.stringify({
          base_url: 'https://api.stripe.com',
          webhook_tolerance: 300 // seconds
        }),
        test_result: 'pending'
      },
      {
        provider_name: 'paystack',
        provider_display_name: 'Paystack',
        secret_key_encrypted: '',
        public_key_encrypted: '',
        webhook_secret_encrypted: '',
        is_active: false,
        supported_currencies: JSON.stringify(['NGN', 'USD', 'EUR', 'GBP']),
        configuration: JSON.stringify({
          base_url: 'https://api.paystack.co',
          currency_fallback: 'NGN'
        }),
        test_result: 'pending'
      }
    ]);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('payment_providers');
};
