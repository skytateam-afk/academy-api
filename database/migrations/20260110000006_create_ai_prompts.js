/**
 * Migration: Create AI Prompts Table
 * Stores versioned prompts that can be managed through Portal UI
 */

exports.up = async function(knex) {
  await knex.schema.createTable('ai_prompts', (table) => {
    table.increments('id').primary();
    table.string('version', 50).notNullable(); // e.g., "v1.0", "v1.1"
    table.string('name', 255).notNullable(); // e.g., "system_prompt", "conversation_prompt"
    table.text('content').notNullable();
    table.text('description');
    table.boolean('is_active').defaultTo(false);
    table.jsonb('metadata').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    
    table.unique(['version', 'name']);
    table.index('version');
    table.index('is_active');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('ai_prompts');
};
