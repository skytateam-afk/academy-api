'use strict';

/**
 * Add metadata column to otp_codes table
 * For storing additional JSON data like MFA tokens
 */

exports.up = function(knex) {
  return knex.schema.table('otp_codes', (table) => {
    table.jsonb('metadata').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('otp_codes', (table) => {
    table.dropColumn('metadata');
  });
};
