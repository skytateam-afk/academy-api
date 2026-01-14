/**
 * Enable required PostgreSQL extensions
 */
exports.up = async function(knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "vector"');
};

exports.down = async function(knex) {
  // Extensions are usually not dropped in down migrations
};
