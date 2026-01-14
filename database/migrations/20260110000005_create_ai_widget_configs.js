/**
 * Migration: Create AI Widget Configs Table
 * Stores widget configuration that can be managed through Portal UI
 */

exports.up = async function(knex) {
  await knex.schema.createTable('ai_widget_configs', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable(); // e.g., "default", "production"
    table.jsonb('config').notNullable(); // Full widget config JSON
    table.boolean('is_active').defaultTo(false);
    table.text('description');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    
    table.index('name');
    table.index('is_active');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('ai_widget_configs');
};
