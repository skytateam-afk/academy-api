/**
 * Create OTP (One-Time Password) table
 * For passwordless authentication via email
 */

exports.up = function(knex) {
    return knex.schema.createTable('otp_codes', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('email', 255).notNullable().index();
        table.string('code', 10).notNullable();
        table.string('type', 50).notNullable().defaultTo('login'); // 'login', 'verify', 'reset'
        table.timestamp('expires_at').notNullable();
        table.boolean('is_used').defaultTo(false);
        table.timestamp('used_at').nullable();
        table.string('ip_address', 45).nullable();
        table.text('user_agent').nullable();
        table.timestamp('created_at').defaultTo(new Date())
        
        // Indexes
        table.index(['email', 'code', 'is_used']);
        table.index(['expires_at', 'is_used']);
    });
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('otp_codes');
};
